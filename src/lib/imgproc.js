// src/lib/imgproc.js
// 来源文件：imgcrop/imgproc.js（逐行等价移植，仅做模块化裁剪）
// 改动：
//   1. 去掉 IIFE 包装与 window.ImgProc 全局赋值；
//   2. 去掉文件末尾的自动 ImgProc.init()，改由调用方显式调用 initImgProc()；
//   3. WASM 地址由相对路径 wasm/imgcrop.wasm 改为绝对路径 /wasm/imgcrop.wasm；
//   4. 未移植 pixelsToDataURL / window.smartCrop / window.bgRemoveThenCrop /
//      window.gridSplit（这些是 UI 层代码，见 src/lib/pixels.js 与 Vue 组件）。
//
// imgproc.js
// ImgCrop 图像处理核心。
// 优先使用 WebAssembly（AssemblyScript 编译产物 wasm/imgcrop.wasm）实现连通域检测与带掩码的裁剪；
// 若 WASM 加载失败，自动回退到等价的纯 JS 实现，保证工具在任何环境可用。
//
// 关键改进：裁剪某个连通域时，包围盒内不属于该连通域的像素会被置为透明，
// 解决精灵图不规则排布时「一个部件的裁剪矩形内混入其他部件」的问题。

const WASM_URL = '/wasm/imgcrop.wasm';

const wasmState = {
  ready: false,
  exports: null,
  memory: null,
  bufs: {} // key -> { ptr, len }
};

// ---------- WASM 内存管理（JS 侧 grow + bump，不依赖 __alloc） ----------
let heapTop = 0;
function allocWasm(size) {
  size = (size + 7) & ~7; // 8 字节对齐
  const cur = wasmState.memory.buffer.byteLength;
  if (heapTop === 0) heapTop = cur; // 从初始内存（静态数据之后）开始
  if (heapTop + size > cur) {
    const needBytes = heapTop + size - cur;
    wasmState.memory.grow(Math.ceil(needBytes / 65536));
  }
  const ptr = heapTop;
  heapTop += size;
  return ptr;
}
function ensureBuf(key, size) {
  const b = wasmState.bufs[key];
  if (b && b.len >= size) return b.ptr;
  const ptr = allocWasm(size);
  wasmState.bufs[key] = { ptr: ptr, len: size };
  return ptr;
}
function u8View(ptr, len) { return new Uint8Array(wasmState.memory.buffer, ptr, len); }
function u32View(ptr, count) { return new Uint32Array(wasmState.memory.buffer, ptr, count); }
function i32View(ptr, count) { return new Int32Array(wasmState.memory.buffer, ptr, count); }

// ---------- 视觉顺序排序（与原有逻辑一致：先从上到下分行，再行内从左到右） ----------
// 注意：这是 imgproc.js 自带的私有副本，不导出；
//       script.js 中另有一份等价实现，见 src/lib/detect.js 的 sortRegions。
function sortRegions(regions) {
  const withCenters = regions.map(r => {
    return { x: r.x, y: r.y, width: r.width, height: r.height, label: r.label, centerX: r.x + r.width / 2, centerY: r.y + r.height / 2 };
  });
  withCenters.sort((a, b) => a.y - b.y);
  const rows = [];
  let curRow = [], curY = null, curH = null;
  withCenters.forEach(r => {
    if (curRow.length === 0 || Math.abs(r.y - curY) < (curH || r.height) / 2) {
      curRow.push(r); curY = r.y; curH = r.height;
    } else {
      rows.push(curRow); curRow = [r]; curY = r.y; curH = r.height;
    }
  });
  if (curRow.length) rows.push(curRow);
  const sorted = [];
  rows.forEach(row => {
    row.sort((a, b) => a.centerX - b.centerX);
    row.forEach(r => {
      sorted.push({ x: r.x, y: r.y, width: r.width, height: r.height, label: r.label });
    });
  });
  return sorted;
}

// ---------- WASM 实现 ----------
function analyzeWasm(imageData, opts) {
  const w = imageData.width, h = imageData.height, n = w * h;
  const d = imageData.data;
  const bgR = d[0], bgG = d[1], bgB = d[2], bgA = d[3];

  const dataPtr = ensureBuf('data', n * 4);
  const labelsPtr = ensureBuf('labels', n * 4);
  const queuePtr = ensureBuf('queue', n * 4);
  const maxRegions = Math.floor(n / 16) + w + h + 16;
  const regionsPtr = ensureBuf('regions', maxRegions * 5 * 4);

  u8View(dataPtr, n * 4).set(d);
  u32View(labelsPtr, n).fill(0);

  const regionCount = wasmState.exports.detect(
    dataPtr, labelsPtr, regionsPtr, queuePtr,
    w, h, bgR, bgG, bgB, bgA,
    opts.tolerance, opts.minPixels, opts.minW, opts.minH, maxRegions
  );

  let regions = [];
  const arr = i32View(regionsPtr, regionCount * 5);
  for (let i = 0; i < regionCount; i++) {
    const b = i * 5;
    regions.push({ x: arr[b], y: arr[b + 1], width: arr[b + 2], height: arr[b + 3], label: arr[b + 4] });
  }
  regions = sortRegions(regions);

  let maxArea = 0;
  for (let j = 0; j < regions.length; j++) {
    const area = regions[j].width * regions[j].height;
    if (area > maxArea) maxArea = area;
  }
  ensureBuf('out', (maxArea || 1) * 4);

  function crop(region) {
    const size = region.width * region.height * 4;
    if (size > wasmState.bufs['out'].len) ensureBuf('out', size);
    const op = wasmState.bufs['out'].ptr;
    wasmState.exports.cropRegion(dataPtr, labelsPtr, w, region.x, region.y, region.width, region.height, region.label, op);
    return new Uint8ClampedArray(wasmState.memory.buffer, op, size).slice();
  }

  return { regions: regions, crop: crop, width: w, height: h };
}

// ---------- JS 回退实现（与 WASM 等价，含裁剪掩码） ----------
function analyzeJS(imageData, opts) {
  const w = imageData.width, h = imageData.height, n = w * h;
  const data = imageData.data;
  const tol = opts.tolerance, minPixels = opts.minPixels, minW = opts.minW, minH = opts.minH;
  const bgR = data[0], bgG = data[1], bgB = data[2], bgA = data[3];

  function isBg(r, g, b, a) {
    if (a === 0) return true;
    return Math.abs(r - bgR) < tol && Math.abs(g - bgG) < tol && Math.abs(b - bgB) < tol && Math.abs(a - bgA) < tol;
  }

  const labels = new Uint32Array(n);
  const queue = new Int32Array(n);
  let regions = [];
  let labelCounter = 1;

  for (let idx = 0; idx < n; idx++) {
    if (labels[idx] !== 0) continue;
    const p = idx * 4;
    if (isBg(data[p], data[p + 1], data[p + 2], data[p + 3])) continue;
    const label = labelCounter++;
    let minX = w, maxX = -1, minY = h, maxY = -1, count = 0;
    let head = 0, tail = 0;
    labels[idx] = label; queue[tail++] = idx;
    while (head < tail) {
      const cur = queue[head++]; count++;
      const cx = cur % w, cy = (cur / w) | 0;
      if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const ni = ny * w + nx;
          if (labels[ni] !== 0) continue;
          const np = ni * 4;
          if (isBg(data[np], data[np + 1], data[np + 2], data[np + 3])) continue;
          labels[ni] = label; queue[tail++] = ni;
        }
      }
    }
    const rw = maxX - minX + 1, rh = maxY - minY + 1;
    if (count > minPixels && rw > minW && rh > minH) {
      regions.push({ x: minX, y: minY, width: rw, height: rh, label: label });
    }
  }

  regions = sortRegions(regions);

  function crop(region) {
    const out = new Uint8ClampedArray(region.width * region.height * 4);
    const want = region.label;
    for (let yy = 0; yy < region.height; yy++) {
      const sy = region.y + yy;
      for (let xx = 0; xx < region.width; xx++) {
        const sx = region.x + xx;
        const si = sy * w + sx;
        const di = (yy * region.width + xx) * 4;
        if (labels[si] === want) {
          const sp = si * 4;
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
/**
 * 初始化：加载并实例化 WASM。
 * @returns {Promise<boolean>} WASM 可用则 true；失败则回退纯 JS 并返回 false（行为与原 ImgProc.init 一致）
 */
export async function initImgProc() {
  if (wasmState.ready) return true;
  try {
    const res = await fetch(WASM_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const bytes = await res.arrayBuffer();
    const imports = {
      env: {
        abort: function (msg, file, line, col) { throw new Error('WASM abort (line ' + line + ':' + col + ')'); },
        trace: function () {},
        seed: function () { return Date.now() % 2147483647; }
      }
    };
    const mod = await WebAssembly.instantiate(bytes, imports);
    const ex = mod.instance.exports;
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
}

/**
 * 连通域检测 + 带掩码裁剪。
 * @param {{data: Uint8ClampedArray, width: number, height: number}} imageData
 * @param {{tolerance?: number, minPixels?: number, minW?: number, minH?: number}} [opts]
 * @returns {{regions: Array, crop: (region: object) => Uint8ClampedArray, width: number, height: number}}
 */
export function analyze(imageData, opts) {
  const o = {
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
}

/** @returns {boolean} 当前是否在用 WASM 实现 */
export function usingWasm() { return wasmState.ready; }
