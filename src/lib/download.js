// src/lib/download.js — 单张下载与 ZIP 打包下载
//
// 对应迁移前 script.js 的 downloadImage / downloadAll / base64ToBlob。
// 依赖由 CDN 改为 npm 包（jszip / file-saver），这样断网也能用，
// 与站点文案里「断网也能用」的承诺一致；版本也随之锁定。

import JSZip from 'jszip';
// file-saver 2.0.5 没有 "module" 字段，是纯 CJS/UMD 包，没有 ESM 产物。
// 因此这里用默认导入再解构：`import { saveAs } from 'file-saver'` 这种具名导入依赖
// 打包器对 CJS 做静态具名导出推断（Node 的 ESM 加载器会直接报
// "Named export 'saveAs' not found"），默认导入在 Node 与 Vite 下都成立。
import FileSaver from 'file-saver';
import { base64ToBlob } from './pixels.js';

const { saveAs } = FileSaver;

/** 下载单张结果，文件名 split_N.png（N 为结果序号，从 1 开始） */
export function downloadImage(image, index) {
  const link = document.createElement('a');
  link.download = `split_${index + 1}.png`;
  link.href = image.dataURL;
  link.click();
}

/**
 * 打包下载全部结果为 split_images.zip。
 * onProgress 收到 0-100 的百分比，与旧实现一样来自 JSZip 的 metadata.percent。
 */
export async function downloadAllAsZip(images, onProgress = () => {}) {
  if (images.length === 0) return false;

  const zip = new JSZip();
  images.forEach((image, index) => {
    const blob = base64ToBlob(image.dataURL.split(',')[1], 'image/png');
    zip.file(`split_${index + 1}.png`, blob);
  });

  const blob = await zip.generateAsync({
    type: 'blob',
    onUpdate: (metadata) => {
      onProgress(Math.round(metadata.percent * 100));
    },
  });

  saveAs(blob, 'split_images.zip');
  return true;
}
