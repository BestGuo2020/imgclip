// src/lib/pipeline.js — 交互流程编排（把算法串成「一次用户操作」）
//
// 重要：迁移前 script.js 与 imgproc.js 定义了同名的全局函数 smartCrop / bgRemoveThenCrop / gridSplit，
// 而 imgproc.js 在 script.js 之后加载，所以**生效的是 imgproc.js 那一份**（基于 WASM 连通域 + 带掩码裁剪）。
// 本文件按生效版本实现，不是 script.js 里被覆盖掉的那份：
//   - smartCrop         → 对应旧 imgproc.js 的 window.smartCrop
//   - bgRemoveThenCrop  → 对应旧 imgproc.js 的 window.bgRemoveThenCrop
//   - gridSplit         → 对应旧 imgproc.js 的 window.gridSplit
//   - backgroundRemove  → 只有 script.js 有（imgproc.js 未覆盖），按 script.js 实现
//   - manualCrop        → 只有 script.js 有，按 script.js 实现
//
// 这些函数是纯编排：只接收 canvas / 图片数组，通过 onProgress 回调上报进度，返回结果数组。
// 不接触 DOM、不接触 Vue，方便单独验证。

import { analyze } from './imgproc.js';
import { computeGrid } from './griddetect.js';
import {
  detectBorderBackgroundColor,
  removeBackgroundFloodFill,
  cleanEdges,
  removeSpeckles,
} from './bgremove.js';
import { pixelsToDataURL } from './pixels.js';

/**
 * 把 RGBA 像素数组裁成 PNG dataURL 结果项。
 * @returns {{id:number, dataURL:string, width:number, height:number}}
 */
function toResultItem(pixels, width, height, id) {
  return { id, dataURL: pixelsToDataURL(pixels, width, height), width, height };
}

/** 从 canvas 取一份独立的 ImageData 副本（后续算法会就地改写像素，必须与画布解耦） */
function readImageData(canvas) {
  const ctx = canvas.getContext('2d');
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * 智能拆分：连通域检测 + 带掩码裁剪。
 * 对应旧 imgproc.js window.smartCrop。
 */
export function runSmartCrop(canvas, onProgress = () => {}) {
  if (!canvas) throw new Error('画布不可用');

  onProgress(0, '正在分析图像...');
  const imageData = readImageData(canvas);

  onProgress(20, '正在检测区域...');
  const session = analyze(imageData);
  const regions = session.regions; // 已按视觉顺序排序

  const results = [];
  const total = regions.length;
  regions.forEach((region, index) => {
    const progress = 20 + Math.round(((index + 1) / total) * 80);
    onProgress(progress, `正在生成第 ${index + 1} 个素材...`);
    // 带掩码裁剪：包围盒内不属于该连通域的像素被置为透明
    results.push(toResultItem(session.crop(region), region.width, region.height, index));
  });

  onProgress(100, '处理完成！');
  return results;
}

/**
 * 先去底再拆分：整图去底 → 连通域检测 → 带掩码裁剪。
 * 对应旧 imgproc.js window.bgRemoveThenCrop。
 */
export function runBgRemoveThenCrop(canvas, onProgress = () => {}) {
  if (!canvas) throw new Error('画布不可用');

  onProgress(10, '正在获取图片...');
  const imageData = readImageData(canvas);

  onProgress(20, '正在创建临时画布...');
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(imageData, 0, 0);

  onProgress(30, '正在检测背景色...');
  const bgColor = detectBorderBackgroundColor(imageData);

  onProgress(40, '正在去除背景...');
  removeBackgroundFloodFill(imageData, bgColor);

  onProgress(50, '正在净化边缘...');
  cleanEdges(imageData, bgColor, 60);

  onProgress(60, '正在去除噪点...');
  removeSpeckles(imageData, 30);

  tempCtx.putImageData(imageData, 0, 0);

  onProgress(70, '正在检测区域...');
  const processed = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const session = analyze(processed);
  const regions = session.regions;

  onProgress(80, '正在生成素材...');
  const results = [];
  const total = regions.length;
  regions.forEach((region, index) => {
    const progress = 80 + Math.round(((index + 1) / total) * 20);
    onProgress(progress, `正在生成第 ${index + 1} 个素材...`);
    results.push(toResultItem(session.crop(region), region.width, region.height, index));
  });

  onProgress(100, '处理完成！');
  return results;
}

/**
 * 网格拆分：自适应背景亮度 → 找行列间隙 → 切格。
 * 对应旧 imgproc.js window.gridSplit。
 * 与智能拆分不同，这里直接 drawImage 原画布（不做掩码），保持旧行为。
 */
export function runGridSplit(canvas, onProgress = () => {}) {
  if (!canvas) throw new Error('画布不可用');

  onProgress(0, '正在分析网格...');
  const imageData = readImageData(canvas);

  onProgress(15, '正在计算行列分布...');
  const tiles = computeGrid(imageData).tiles;

  onProgress(50, '正在切分...');
  const results = [];
  const total = tiles.length;
  tiles.forEach((tile, index) => {
    const progress = 50 + Math.round(((index + 1) / total) * 50);
    onProgress(progress, `正在切分 ${index + 1}/${total} ...`);

    const c = document.createElement('canvas');
    c.width = tile.w;
    c.height = tile.h;
    c.getContext('2d').drawImage(canvas, tile.x, tile.y, tile.w, tile.h, 0, 0, tile.w, tile.h);
    results.push({ id: index, dataURL: c.toDataURL('image/png'), width: tile.w, height: tile.h });
  });

  onProgress(100, '处理完成！');
  return results;
}

/** 单张图片去底：把 dataURL 画到离屏画布 → 去底 → 回写 dataURL */
async function removeBackgroundOfImage(image) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const el = new Image();
  el.crossOrigin = 'Anonymous';
  await new Promise((resolve, reject) => {
    el.onload = resolve;
    el.onerror = reject;
    el.src = image.dataURL;
  });

  canvas.width = el.width;
  canvas.height = el.height;
  ctx.drawImage(el, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const bgColor = detectBorderBackgroundColor(imageData);
  removeBackgroundFloodFill(imageData, bgColor);
  // 边缘净化容差 60 比泛洪更大，专门对付边缘顽固的半透明像素
  cleanEdges(imageData, bgColor, 60);
  // 小于 30 像素的独立小块视为噪点
  removeSpeckles(imageData, 30);

  ctx.putImageData(imageData, 0, 0);
  return { ...image, dataURL: canvas.toDataURL('image/png') };
}

/**
 * 一键去底：对「已有拆分结果」逐张去底。
 * 对应旧 script.js 的 backgroundRemove + processSingleImageBackground。
 * 旧实现若发现结果为空会自己调一次 smartCrop 再等 100ms，这是段不可靠的时序代码；
 * 迁移后由调用方在「结果为空」时先明确跑一次智能拆分，语义更清晰。
 */
export async function runBackgroundRemove(images, onProgress = () => {}) {
  const total = images.length;
  const processed = [];
  for (let i = 0; i < total; i++) {
    onProgress(Math.round((i / total) * 100), `正在处理第 ${i + 1} 个素材...`);
    processed.push(await removeBackgroundOfImage(images[i]));
  }
  onProgress(100, '处理完成！');
  return processed;
}

/** 手动拆分：把 cropper 当前选区作为一张结果加入。对应旧 script.js 的 manualCrop。 */
export function manualCropOne(canvas) {
  if (!canvas) throw new Error('画布不可用');
  return {
    dataURL: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
  };
}
