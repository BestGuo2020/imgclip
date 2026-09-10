// src/lib/pixels.js
// 来源文件：
//   imgproc.js 第 241-249 行  -> pixelsToDataURL
//   script.js  第 1516-1526 行 -> base64ToBlob
// 逐行等价移植，未改动逻辑与常量（512 分片、'image/png' 等保持原样）。
// 本模块依赖浏览器环境（document / canvas / atob / Blob），不引入任何依赖。

// 将 RGBA 像素写入新画布并转成 PNG dataURL
export function pixelsToDataURL(pixels, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cctx = c.getContext('2d');
  const imgData = cctx.createImageData(w, h);
  imgData.data.set(pixels);
  cctx.putImageData(imgData, 0, 0);
  return c.toDataURL('image/png');
}

export function base64ToBlob(base64, mime) {
  const byteChars = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteChars.length; offset += 512) {
    const slice = byteChars.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: mime });
}
