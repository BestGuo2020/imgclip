// ImgCrop 图像处理核心（AssemblyScript -> WebAssembly）
//
// 内存 ABI（所有指针均为线性内存中的字节偏移，由 JS 通过 __alloc 分配）：
//   dataPtr    : RGBA 字节数组，长度 width*height*4
//   labelsPtr  : 每像素 u32 标签图，长度 width*height（0 = 背景，否则为连通域编号）
//   regionsPtr : 每个区域 5 个 i32 [x, y, w, h, label]
//   queuePtr   : BFS 队列（i32 像素索引），容量 width*height
//   outPtr     : 单个裁剪结果的 RGBA 字节数组，长度 w*h*4

function iabs(x: i32): i32 {
  return x < 0 ? -x : x;
}

function isBackgroundColor(
  r: i32, g: i32, b: i32, a: i32,
  bgR: i32, bgG: i32, bgB: i32, bgA: i32,
  tolerance: i32
): bool {
  if (a == 0) return true;
  return iabs(r - bgR) < tolerance &&
         iabs(g - bgG) < tolerance &&
         iabs(b - bgB) < tolerance &&
         iabs(a - bgA) < tolerance;
}

// 连通域检测：返回通过过滤的区域数量，并填充标签图与区域列表。
// 与原始 detectRange 语义一致：以左上角像素为背景色，8 邻域 BFS，过滤噪点。
export function detect(
  dataPtr: usize,
  labelsPtr: usize,
  regionsPtr: usize,
  queuePtr: usize,
  width: i32,
  height: i32,
  bgR: i32,
  bgG: i32,
  bgB: i32,
  bgA: i32,
  tolerance: i32,
  minPixels: i32,
  minW: i32,
  minH: i32,
  maxRegions: i32
): i32 {
  if (width <= 0 || height <= 0) return 0;

  const total: i32 = width * height;
  let regionCount: i32 = 0;
  let labelCounter: i32 = 1;

  for (let idx: i32 = 0; idx < total; idx++) {
    const labelOff: usize = labelsPtr + usize(idx) * 4;
    if (load<u32>(labelOff) != 0) continue;

    const px: usize = dataPtr + usize(idx) * 4;
    const r: i32 = i32(load<u8>(px));
    const g: i32 = i32(load<u8>(px + 1));
    const b: i32 = i32(load<u8>(px + 2));
    const a: i32 = i32(load<u8>(px + 3));
    if (isBackgroundColor(r, g, b, a, bgR, bgG, bgB, bgA, tolerance)) continue;

    const label: i32 = labelCounter;
    labelCounter++;

    let minX: i32 = width;
    let maxX: i32 = -1;
    let minY: i32 = height;
    let maxY: i32 = -1;
    let pixelCount: i32 = 0;
    let head: i32 = 0;
    let tail: i32 = 0;

    store<u32>(labelOff, u32(label));
    store<i32>(queuePtr + usize(tail) * 4, idx);
    tail++;

    while (head < tail) {
      const cur: i32 = load<i32>(queuePtr + usize(head) * 4);
      head++;
      pixelCount++;

      const cx: i32 = cur % width;
      const cy: i32 = cur / width;

      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;

      for (let dy: i32 = -1; dy <= 1; dy++) {
        for (let dx: i32 = -1; dx <= 1; dx++) {
          if (dx == 0 && dy == 0) continue;
          const nx: i32 = cx + dx;
          const ny: i32 = cy + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nIdx: i32 = ny * width + nx;
          const nLabelOff: usize = labelsPtr + usize(nIdx) * 4;
          if (load<u32>(nLabelOff) != 0) continue;
          const npx: usize = dataPtr + usize(nIdx) * 4;
          const nr: i32 = i32(load<u8>(npx));
          const ng: i32 = i32(load<u8>(npx + 1));
          const nb: i32 = i32(load<u8>(npx + 2));
          const na: i32 = i32(load<u8>(npx + 3));
          if (isBackgroundColor(nr, ng, nb, na, bgR, bgG, bgB, bgA, tolerance)) continue;
          store<u32>(nLabelOff, u32(label));
          store<i32>(queuePtr + usize(tail) * 4, nIdx);
          tail++;
        }
      }
    }

    const rw: i32 = maxX - minX + 1;
    const rh: i32 = maxY - minY + 1;
    if (pixelCount > minPixels && rw > minW && rh > minH && regionCount < maxRegions) {
      const base: usize = regionsPtr + usize(regionCount) * 20;
      store<i32>(base, minX);
      store<i32>(base + 4, minY);
      store<i32>(base + 8, rw);
      store<i32>(base + 12, rh);
      store<i32>(base + 16, label);
      regionCount++;
    }
  }

  return regionCount;
}

// 裁剪指定连通域：包围盒内不属于该连通域的像素置为透明。
// 这是相对旧实现（直接 drawImage 整个包围盒）的关键改进：
// 精灵图不规则排布时，包围盒内可能包含其他部件的一部分，这些像素应被剔除。
export function cropRegion(
  dataPtr: usize,
  labelsPtr: usize,
  width: i32,
  x: i32,
  y: i32,
  w: i32,
  h: i32,
  label: i32,
  outPtr: usize
): void {
  const want: u32 = u32(label);
  for (let yy: i32 = 0; yy < h; yy++) {
    const sy: i32 = y + yy;
    for (let xx: i32 = 0; xx < w; xx++) {
      const sx: i32 = x + xx;
      const srcIdx: i32 = sy * width + sx;
      const srcOff: usize = usize(srcIdx) * 4;
      const dstOff: usize = usize(yy * w + xx) * 4;
      if (load<u32>(labelsPtr + srcOff) == want) {
        // 一次 32 位读写复制整颗像素（RGBA 共 4 字节）
        store<u32>(outPtr + dstOff, load<u32>(dataPtr + srcOff));
      } else {
        store<u32>(outPtr + dstOff, 0);
      }
    }
  }
}
