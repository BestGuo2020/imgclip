// src/lib/griddetect.js
// 来源文件：imgcrop/grid.js（逐行等价移植）
// 改动：去掉原 IIFE 包装与 root.GridDetect 全局赋值，改为 ES 模块导出；
//       var -> const/let，逻辑结构、常量、循环边界、typed array 类型全部保持原样。
//
// grid.js — 矩形网格检测核心（自适应背景）
// 用于把规则排列的矩形对象（牌阵、贴纸网格、Sprite 表等）切成单个对象。
// 原理：自适应估计背景亮度，把「与背景相差明显」的像素视为内容，
//       内容密度在对象处高、在间隙处≈0，据此找出行/列间隙再分格。
// 同时支持：深色背景上的浅色对象、浅色背景上的深色对象。

const TH_DIFF = 40;        // 与背景亮度的最小差异，超过即算“内容”
const TH_CONTENT = 0.02;   // 间隙判定：内容密度 < 2%
const MIN_GAP = 4;         // 间隙最小宽度(px)
const MIN_CELL_CONTENT = 50; // 格内内容像素少于该值视为空/透明格

// 中位数（原 grid.js 内部函数，原样保留为模块私有）
function median(arr) {
  if (!arr.length) return 128;
  const a = arr.slice().sort((x, y) => x - y);
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export function findGaps(content, n, th, minGap) {
  const gaps = [];
  let s = -1;
  for (let i = 0; i < n; i++) {
    if (content[i] < th && s < 0) s = i;
    else if (content[i] >= th && s >= 0) { if (i - s >= minGap) gaps.push([s, i - 1]); s = -1; }
  }
  if (s >= 0 && n - s >= minGap) gaps.push([s, n - 1]);
  return gaps;
}

export function edgesFromGaps(gaps, total) {
  const edges = [0];
  for (let i = 0; i < gaps.length; i++) edges.push(Math.round((gaps[i][0] + gaps[i][1]) / 2));
  edges.push(total);
  return edges;
}

// 估计背景亮度（原 grid.js 内部函数，原样保留为模块私有）
function estimateBackgroundLum(data, w, h) {
  const lums = [];
  let i;
  // 四条边采样（排除透明）
  for (let x = 0; x < w; x++) {
    i = x * 4; if (data[i + 3] !== 0) lums.push((data[i] + data[i + 1] + data[i + 2]) / 3);
    i = ((h - 1) * w + x) * 4; if (data[i + 3] !== 0) lums.push((data[i] + data[i + 1] + data[i + 2]) / 3);
  }
  for (let y = 0; y < h; y++) {
    i = (y * w) * 4; if (data[i + 3] !== 0) lums.push((data[i] + data[i + 1] + data[i + 2]) / 3);
    i = (y * w + (w - 1)) * 4; if (data[i + 3] !== 0) lums.push((data[i] + data[i + 1] + data[i + 2]) / 3);
  }
  return median(lums);
}

// imageData = { data: Uint8ClampedArray(RGBA), width, height }
export function computeGrid(imageData) {
  const w = imageData.width, h = imageData.height;
  const data = imageData.data;

  const bgLum = estimateBackgroundLum(data, w, h);

  const colContent = new Float64Array(w), colValid = new Float64Array(w);
  const rowContent = new Float64Array(h), rowValid = new Float64Array(h);
  const contentMask = new Uint8Array(w * h);

  for (let y = 0; y < h; y++) {
    const rowBase = y * w;
    for (let x = 0; x < w; x++) {
      const i = (rowBase + x) * 4;
      const a = data[i + 3];
      if (a === 0) continue;
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      colValid[x]++; rowValid[y]++;
      if (Math.abs(lum - bgLum) > TH_DIFF) { colContent[x]++; rowContent[y]++; contentMask[rowBase + x] = 1; }
    }
  }
  // 注：原文件此处用 var 重复声明 x / y（var 允许重复声明）；
  //     改写为 let 后变量名改为 x2 / y2，遍历范围与语义完全一致。
  for (let x2 = 0; x2 < w; x2++) colContent[x2] = colValid[x2] ? colContent[x2] / colValid[x2] : 0;
  for (let y2 = 0; y2 < h; y2++) rowContent[y2] = rowValid[y2] ? rowContent[y2] / rowValid[y2] : 0;

  const colGaps = findGaps(colContent, w, TH_CONTENT, MIN_GAP);
  const rowGaps = findGaps(rowContent, h, TH_CONTENT, MIN_GAP);
  const colEdges = edgesFromGaps(colGaps, w);
  const rowEdges = edgesFromGaps(rowGaps, h);

  const tiles = [];
  for (let ri = 0; ri < rowEdges.length - 1; ri++) {
    for (let ci = 0; ci < colEdges.length - 1; ci++) {
      const x0 = colEdges[ci], x1 = colEdges[ci + 1];
      const y0 = rowEdges[ri], y1 = rowEdges[ri + 1];
      let cnt = 0;
      for (let yy = y0; yy < y1; yy++) {
        const base = yy * w;
        for (let xx = x0; xx < x1; xx++) if (contentMask[base + xx]) cnt++;
      }
      if (cnt < MIN_CELL_CONTENT) continue;
      tiles.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    }
  }
  return { colEdges: colEdges, rowEdges: rowEdges, tiles: tiles, bgLum: bgLum };
}
