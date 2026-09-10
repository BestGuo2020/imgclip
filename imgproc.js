// imgproc.js
// ImgCrop 图像处理核心。
// 优先使用 WebAssembly（AssemblyScript 编译产物 wasm/imgcrop.wasm）实现连通域检测与带掩码的裁剪；
// 若 WASM 加载失败，自动回退到等价的纯 JS 实现，保证工具在任何环境可用。
//
// 关键改进：裁剪某个连通域时，包围盒内不属于该连通域的像素会被置为透明，
// 解决精灵图不规则排布时「一个部件的裁剪矩形内混入其他部件」的问题。
(function () {
  'use strict';

  var WASM_URL = 'wasm/imgcrop.wasm';

  var wasmState = {
    ready: false,
    exports: null,
    memory: null,
    bufs: {} // key -> { ptr, len }
  };

  // ---------- WASM 内存管理（JS 侧 grow + bump，不依赖 __alloc） ----------
  var heapTop = 0;
  function allocWasm(size) {
    size = (size + 7) & ~7; // 8 字节对齐
    var cur = wasmState.memory.buffer.byteLength;
    if (heapTop === 0) heapTop = cur; // 从初始内存（静态数据之后）开始
    if (heapTop + size > cur) {
      var needBytes = heapTop + size - cur;
      wasmState.memory.grow(Math.ceil(needBytes / 65536));
    }
    var ptr = heapTop;
    heapTop += size;
    return ptr;
  }
  function ensureBuf(key, size) {
    var b = wasmState.bufs[key];
    if (b && b.len >= size) return b.ptr;
    var ptr = allocWasm(size);
    wasmState.bufs[key] = { ptr: ptr, len: size };
    return ptr;
  }
  function u8View(ptr, len) { return new Uint8Array(wasmState.memory.buffer, ptr, len); }
  function u32View(ptr, count) { return new Uint32Array(wasmState.memory.buffer, ptr, count); }
  function i32View(ptr, count) { return new Int32Array(wasmState.memory.buffer, ptr, count); }

  // ---------- 视觉顺序排序（与原有逻辑一致：先从上到下分行，再行内从左到右） ----------
  function sortRegions(regions) {
    var withCenters = regions.map(function (r) {
      return { x: r.x, y: r.y, width: r.width, height: r.height, label: r.label, centerX: r.x + r.width / 2, centerY: r.y + r.height / 2 };
    });
    withCenters.sort(function (a, b) { return a.y - b.y; });
    var rows = [], curRow = [], curY = null, curH = null;
    withCenters.forEach(function (r) {
      if (curRow.length === 0 || Math.abs(r.y - curY) < (curH || r.height) / 2) {
        curRow.push(r); curY = r.y; curH = r.height;
      } else {
        rows.push(curRow); curRow = [r]; curY = r.y; curH = r.height;
      }
    });
    if (curRow.length) rows.push(curRow);
    var sorted = [];
    rows.forEach(function (row) {
      row.sort(function (a, b) { return a.centerX - b.centerX; });
      row.forEach(function (r) {
        sorted.push({ x: r.x, y: r.y, width: r.width, height: r.height, label: r.label });
      });
    });
    return sorted;
  }

  // ---------- WASM 实现 ----------
  function analyzeWasm(imageData, opts) {
    var w = imageData.width, h = imageData.height, n = w * h;
    var d = imageData.data;
    var bgR = d[0], bgG = d[1], bgB = d[2], bgA = d[3];

    var dataPtr = ensureBuf('data', n * 4);
    var labelsPtr = ensureBuf('labels', n * 4);
    var queuePtr = ensureBuf('queue', n * 4);
    var maxRegions = Math.floor(n / 16) + w + h + 16;
    var regionsPtr = ensureBuf('regions', maxRegions * 5 * 4);

    u8View(dataPtr, n * 4).set(d);
    u32View(labelsPtr, n).fill(0);

    var regionCount = wasmState.exports.detect(
      dataPtr, labelsPtr, regionsPtr, queuePtr,
      w, h, bgR, bgG, bgB, bgA,
      opts.tolerance, opts.minPixels, opts.minW, opts.minH, maxRegions
    );

    var regions = [];
    var arr = i32View(regionsPtr, regionCount * 5);
    for (var i = 0; i < regionCount; i++) {
      var b = i * 5;
      regions.push({ x: arr[b], y: arr[b + 1], width: arr[b + 2], height: arr[b + 3], label: arr[b + 4] });
    }
    regions = sortRegions(regions);

    var maxArea = 0;
    for (var j = 0; j < regions.length; j++) {
      var area = regions[j].width * regions[j].height;
      if (area > maxArea) maxArea = area;
    }
    ensureBuf('out', (maxArea || 1) * 4);

    function crop(region) {
      var size = region.width * region.height * 4;
      if (size > wasmState.bufs['out'].len) ensureBuf('out', size);
      var op = wasmState.bufs['out'].ptr;
      wasmState.exports.cropRegion(dataPtr, labelsPtr, w, region.x, region.y, region.width, region.height, region.label, op);
      return new Uint8ClampedArray(wasmState.memory.buffer, op, size).slice();
    }

    return { regions: regions, crop: crop, width: w, height: h };
  }

  // ---------- JS 回退实现（与 WASM 等价，含裁剪掩码） ----------
  function analyzeJS(imageData, opts) {
    var w = imageData.width, h = imageData.height, n = w * h;
    var data = imageData.data;
    var tol = opts.tolerance, minPixels = opts.minPixels, minW = opts.minW, minH = opts.minH;
    var bgR = data[0], bgG = data[1], bgB = data[2], bgA = data[3];

    function isBg(r, g, b, a) {
      if (a === 0) return true;
      return Math.abs(r - bgR) < tol && Math.abs(g - bgG) < tol && Math.abs(b - bgB) < tol && Math.abs(a - bgA) < tol;
    }

    var labels = new Uint32Array(n);
    var queue = new Int32Array(n);
    var regions = [];
    var labelCounter = 1;

    for (var idx = 0; idx < n; idx++) {
      if (labels[idx] !== 0) continue;
      var p = idx * 4;
      if (isBg(data[p], data[p + 1], data[p + 2], data[p + 3])) continue;
      var label = labelCounter++;
      var minX = w, maxX = -1, minY = h, maxY = -1, count = 0;
      var head = 0, tail = 0;
      labels[idx] = label; queue[tail++] = idx;
      while (head < tail) {
        var cur = queue[head++]; count++;
        var cx = cur % w, cy = (cur / w) | 0;
        if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            var nx = cx + dx, ny = cy + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            var ni = ny * w + nx;
            if (labels[ni] !== 0) continue;
            var np = ni * 4;
            if (isBg(data[np], data[np + 1], data[np + 2], data[np + 3])) continue;
            labels[ni] = label; queue[tail++] = ni;
          }
        }
      }
      var rw = maxX - minX + 1, rh = maxY - minY + 1;
      if (count > minPixels && rw > minW && rh > minH) {
        regions.push({ x: minX, y: minY, width: rw, height: rh, label: label });
      }
    }

    regions = sortRegions(regions);

    function crop(region) {
      var out = new Uint8ClampedArray(region.width * region.height * 4);
      var want = region.label;
      for (var yy = 0; yy < region.height; yy++) {
        var sy = region.y + yy;
        for (var xx = 0; xx < region.width; xx++) {
          var sx = region.x + xx;
          var si = sy * w + sx;
          var di = (yy * region.width + xx) * 4;
          if (labels[si] === want) {
            var sp = si * 4;
            out[di] = data[sp]; out[di + 1] = data[sp + 1]; out[di + 2] = data[sp + 2]; out[di + 3] = data[sp + 3];
          } else {
            out[di] = 0; out[di + 1] = 0; out[di + 2] = 0; out[di + 3] = 0;
          }
        }
      }
      return out;
    }

    return { regions: regions, crop: crop, width: w, height: h };
  }

  // ---------- 公开 API ----------
  var ImgProc = {
    ready: false,
    init: async function () {
      if (wasmState.ready) return true;
      try {
        var res = await fetch(WASM_URL);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var bytes = await res.arrayBuffer();
        var imports = {
          env: {
            abort: function (msg, file, line, col) { throw new Error('WASM abort (line ' + line + ':' + col + ')'); },
            trace: function () {},
            seed: function () { return Date.now() % 2147483647; }
          }
        };
        var mod = await WebAssembly.instantiate(bytes, imports);
        var ex = mod.instance.exports;
        if (typeof ex.detect !== 'function' || typeof ex.cropRegion !== 'function') throw new Error('缺少期望的导出函数');
        if (!ex.memory) throw new Error('缺少 memory 导出');
        wasmState.exports = ex;
        wasmState.memory = ex.memory;
        wasmState.ready = true;
        console.info('[ImgProc] WebAssembly 已启用（AssemblyScript）');
      } catch (e) {
        wasmState.ready = false;
        console.warn('[ImgProc] WebAssembly 不可用，回退到 JS 实现：', (e && e.message) ? e.message : e);
      }
      return wasmState.ready;
    },
    analyze: function (imageData, opts) {
      var o = {
        tolerance: (opts && opts.tolerance != null) ? opts.tolerance : 15,
        minPixels: (opts && opts.minPixels != null) ? opts.minPixels : 20,
        minW: (opts && opts.minW != null) ? opts.minW : 4,
        minH: (opts && opts.minH != null) ? opts.minH : 4
      };
      if (wasmState.ready) {
        try { return analyzeWasm(imageData, o); }
        catch (e) { console.warn('[ImgProc] WASM 运行出错，回退 JS：', (e && e.message) ? e.message : e); }
      }
      return analyzeJS(imageData, o);
    },
    usingWasm: function () { return wasmState.ready; }
  };

  window.ImgProc = ImgProc;
  ImgProc.init();

  // 将 RGBA 像素写入新画布并转成 PNG dataURL
  function pixelsToDataURL(pixels, w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var cctx = c.getContext('2d');
    var imgData = cctx.createImageData(w, h);
    imgData.data.set(pixels);
    cctx.putImageData(imgData, 0, 0);
    return c.toDataURL('image/png');
  }

  // ---------- 覆盖 script.js 中的智能拆分（使用带掩码的连通域裁剪） ----------
  window.smartCrop = function () {
    var loading = document.getElementById('loading');
    loading.style.display = 'inline-block';
    showProgress();
    updateProgress(0, '正在分析图像...');
    document.getElementById('cropBtn').disabled = true;
    document.getElementById('manualCropBtn').disabled = true;

    setTimeout(function () {
      try {
        var canvas = cropper.getCroppedCanvas();
        if (!canvas) throw new Error('画布不可用');
        var imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);

        updateProgress(20, '正在检测区域...');
        var session = ImgProc.analyze(imageData);
        var regions = session.regions; // 已按视觉顺序排序

        croppedImages = [];
        var total = regions.length;
        regions.forEach(function (region, index) {
          var progress = 20 + Math.round((index + 1) / total * 80);
          updateProgress(progress, '正在生成第 ' + (index + 1) + ' 个素材...');

          var pixels = session.crop(region); // 剔除包围盒内其他部件的像素
          croppedImages.push({
            id: index,
            dataURL: pixelsToDataURL(pixels, region.width, region.height),
            width: region.width,
            height: region.height
          });
        });

        updateProgress(100, '处理完成！');
        displayResults();

        setTimeout(function () {
          loading.style.display = 'none';
          hideProgress();
        }, 300);

        document.getElementById('cropBtn').disabled = false;
        document.getElementById('manualCropBtn').disabled = false;
        document.getElementById('downloadAllBtn').disabled = croppedImages.length === 0;
      } catch (e) {
        console.error('[ImgProc] smartCrop 失败：', e);
        loading.style.display = 'none';
        hideProgress();
        document.getElementById('cropBtn').disabled = false;
        document.getElementById('manualCropBtn').disabled = false;
      }
    }, 50);
  };

  // ---------- 覆盖「先去底再拆分」：先对整图去底，再用带掩码的连通域拆分 ----------
  window.bgRemoveThenCrop = function () {
    var loading = document.getElementById('loading');
    loading.style.display = 'inline-block';
    showProgress();
    updateProgress(0, '准备中...');
    toggleButtons(true);

    function finish() {
      setTimeout(function () {
        loading.style.display = 'none';
        hideProgress();
      }, 300);
      toggleButtons(false);
    }

    try {
      updateProgress(10, '正在获取图片...');
      var canvas = cropper.getCroppedCanvas();
      var imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);

      updateProgress(20, '正在创建临时画布...');
      var tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width; tempCanvas.height = canvas.height;
      var tempCtx = tempCanvas.getContext('2d');
      tempCtx.putImageData(imageData, 0, 0);

      updateProgress(30, '正在检测背景色...');
      var bgColor = detectBorderBackgroundColor(imageData);

      updateProgress(40, '正在去除背景...');
      removeBackgroundFloodFill(imageData, bgColor);

      updateProgress(50, '正在净化边缘...');
      cleanEdges(imageData, bgColor, 60);

      updateProgress(60, '正在去除噪点...');
      removeSpeckles(imageData, 30);

      tempCtx.putImageData(imageData, 0, 0);

      updateProgress(70, '正在检测区域...');
      var processed = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      var session = ImgProc.analyze(processed);
      var regions = session.regions;

      updateProgress(80, '正在生成素材...');
      croppedImages = [];
      var total = regions.length;
      regions.forEach(function (region, index) {
        var progress = 80 + Math.round((index + 1) / total * 20);
        updateProgress(progress, '正在生成第 ' + (index + 1) + ' 个素材...');
        var pixels = session.crop(region);
        croppedImages.push({
          id: index,
          dataURL: pixelsToDataURL(pixels, region.width, region.height),
          width: region.width,
          height: region.height
        });
      });

      updateProgress(100, '处理完成！');
      displayResults();
      finish();
    } catch (e) {
      console.error('[ImgProc] bgRemoveThenCrop 失败：', e);
      hideProgress();
      finish();
    }
  };

  // ---------- 网格拆分：把规则排列的矩形对象切成单个 ----------
  window.gridSplit = function () {
    var loading = document.getElementById('loading');
    loading.style.display = 'inline-block';
    showProgress();
    updateProgress(0, '正在分析网格...');
    toggleButtons(true);

    setTimeout(function () {
      try {
        var canvas = cropper.getCroppedCanvas();
        if (!canvas) throw new Error('画布不可用');
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        updateProgress(15, '正在计算行列分布...');
        var tiles = GridDetect.computeGrid(imageData).tiles;

        updateProgress(50, '正在切分...');
        croppedImages = [];
        var total = tiles.length;
        tiles.forEach(function (t, index) {
          var progress = 50 + Math.round((index + 1) / total * 50);
          updateProgress(progress, '正在切分 ' + (index + 1) + '/' + total + ' ...');
          var c = document.createElement('canvas');
          c.width = t.w; c.height = t.h;
          c.getContext('2d').drawImage(canvas, t.x, t.y, t.w, t.h, 0, 0, t.w, t.h);
          croppedImages.push({ id: index, dataURL: c.toDataURL('image/png'), width: t.w, height: t.h });
        });

        updateProgress(100, '处理完成！');
        displayResults();
        setTimeout(function () { loading.style.display = 'none'; hideProgress(); }, 300);
      } catch (e) {
        console.error('[ImgProc] gridSplit 失败：', e);
        loading.style.display = 'none';
        hideProgress();
      } finally {
        toggleButtons(false);
        document.getElementById('downloadAllBtn').disabled = croppedImages.length === 0;
      }
    }, 50);
  };
})();
