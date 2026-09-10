// grid.js — 矩形网格检测核心（自适应背景）
// 用于把规则排列的矩形对象（牌阵、贴纸网格、Sprite 表等）切成单个对象。
// 原理：自适应估计背景亮度，把「与背景相差明显」的像素视为内容，
//       内容密度在对象处高、在间隙处≈0，据此找出行/列间隙再分格。
// 同时支持：深色背景上的浅色对象、浅色背景上的深色对象。
(function (root) {
  'use strict';

  var TH_DIFF = 40;        // 与背景亮度的最小差异，超过即算“内容”
  var TH_CONTENT = 0.02;   // 间隙判定：内容密度 < 2%
  var MIN_GAP = 4;         // 间隙最小宽度(px)
  var MIN_CELL_CONTENT = 50; // 格内内容像素少于该值视为空/透明格

  function median(arr) {
    if (!arr.length) return 128;
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var m = a.length >> 1;
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  function findGaps(content, n, th, minGap) {
    var gaps = [];
    var s = -1;
    for (var i = 0; i < n; i++) {
      if (content[i] < th && s < 0) s = i;
      else if (content[i] >= th && s >= 0) { if (i - s >= minGap) gaps.push([s, i - 1]); s = -1; }
    }
    if (s >= 0 && n - s >= minGap) gaps.push([s, n - 1]);
    return gaps;
  }

  function edgesFromGaps(gaps, total) {
    var edges = [0];
    for (var i = 0; i < gaps.length; i++) edges.push(Math.round((gaps[i][0] + gaps[i][1]) / 2));
    edges.push(total);
    return edges;
  }

  function estimateBackgroundLum(data, w, h) {
    var lums = [];
    var i;
    // 四条边采样（排除透明）
    for (var x = 0; x < w; x++) {
      i = x * 4; if (data[i + 3] !== 0) lums.push((data[i] + data[i + 1] + data[i + 2]) / 3);
      i = ((h - 1) * w + x) * 4; if (data[i + 3] !== 0) lums.push((data[i] + data[i + 1] + data[i + 2]) / 3);
    }
    for (var y = 0; y < h; y++) {
      i = (y * w) * 4; if (data[i + 3] !== 0) lums.push((data[i] + data[i + 1] + data[i + 2]) / 3);
      i = (y * w + (w - 1)) * 4; if (data[i + 3] !== 0) lums.push((data[i] + data[i + 1] + data[i + 2]) / 3);
    }
    return median(lums);
  }

  // imageData = { data: Uint8ClampedArray(RGBA), width, height }
  function computeGrid(imageData) {
    var w = imageData.width, h = imageData.height;
    var data = imageData.data;

    var bgLum = estimateBackgroundLum(data, w, h);

    var colContent = new Float64Array(w), colValid = new Float64Array(w);
    var rowContent = new Float64Array(h), rowValid = new Float64Array(h);
    var contentMask = new Uint8Array(w * h);

    for (var y = 0; y < h; y++) {
      var rowBase = y * w;
      for (var x = 0; x < w; x++) {
        var i = (rowBase + x) * 4;
        var a = data[i + 3];
        if (a === 0) continue;
        var lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
        colValid[x]++; rowValid[y]++;
        if (Math.abs(lum - bgLum) > TH_DIFF) { colContent[x]++; rowContent[y]++; contentMask[rowBase + x] = 1; }
      }
    }
    for (var x = 0; x < w; x++) colContent[x] = colValid[x] ? colContent[x] / colValid[x] : 0;
    for (var y = 0; y < h; y++) rowContent[y] = rowValid[y] ? rowContent[y] / rowValid[y] : 0;

    var colGaps = findGaps(colContent, w, TH_CONTENT, MIN_GAP);
    var rowGaps = findGaps(rowContent, h, TH_CONTENT, MIN_GAP);
    var colEdges = edgesFromGaps(colGaps, w);
    var rowEdges = edgesFromGaps(rowGaps, h);

    var tiles = [];
    for (var ri = 0; ri < rowEdges.length - 1; ri++) {
      for (var ci = 0; ci < colEdges.length - 1; ci++) {
        var x0 = colEdges[ci], x1 = colEdges[ci + 1];
        var y0 = rowEdges[ri], y1 = rowEdges[ri + 1];
        var cnt = 0;
        for (var yy = y0; yy < y1; yy++) {
          var base = yy * w;
          for (var xx = x0; xx < x1; xx++) if (contentMask[base + xx]) cnt++;
        }
        if (cnt < MIN_CELL_CONTENT) continue;
        tiles.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
      }
    }
    return { colEdges: colEdges, rowEdges: rowEdges, tiles: tiles, bgLum: bgLum };
  }

  var api = { computeGrid: computeGrid, findGaps: findGaps, edgesFromGaps: edgesFromGaps };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.GridDetect = api;
})(typeof self !== 'undefined' ? self : this);
