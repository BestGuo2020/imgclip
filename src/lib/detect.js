// src/lib/detect.js
// 来源文件：imgcrop/script.js（逐行等价抽取，仅做模块化）
// 抽取范围（原脚本行号）：
//   sortRegions         (1148-1193)
//   detectRange         (1328-1432)
//   isBackgroundColor   (1434-1437)
// 说明：
//   - imgproc.js 内部另有一份私有 sortRegions（结构略有不同：显式重建对象、丢弃额外字段），
//     按约定各自保留在各自模块中，不互相 import，避免循环依赖。
//   - 本模块不 import 其它模块。
// 未做任何算法参数调整：容差 15、pixelCount > 20、w > 4、h > 4、8 邻域等全部原样保留。

/**
 * 统一区域排序函数：按照视觉顺序（从上到下，从左到右）排序区域
 * @param {Array} regions - 待排序的区域数组
 * @returns {Array} - 排序后的区域数组
 */
export function sortRegions(regions) {
  // 1. 为每个区域计算中心点坐标
  const regionsWithCenters = regions.map(region => ({
    ...region,
    centerX: region.x + region.width / 2,
    centerY: region.y + region.height / 2
  }));

  // 2. 首先按照区域顶部坐标排序，初步确定行顺序
  regionsWithCenters.sort((a, b) => a.y - b.y);

  // 3. 分组行
  const rows = [];
  let currentRow = [];
  let currentRowY = null;
  let currentRowHeight = null;

  regionsWithCenters.forEach(region => {
    // 如果是第一行或者当前区域的顶部坐标与当前行的Y坐标之差小于行高的1/2，则认为是同一行
    if (currentRow.length === 0 ||
      Math.abs(region.y - currentRowY) < (currentRowHeight || region.height) / 2) {
      currentRow.push(region);
      currentRowY = region.y;
      currentRowHeight = region.height;
    } else {
      // 新的一行
      rows.push(currentRow);
      currentRow = [region];
      currentRowY = region.y;
      currentRowHeight = region.height;
    }
  });

  // 添加最后一行
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  // 4. 对每行内的区域按照中心点X坐标排序（从左到右）
  const sortedRegions = rows.flatMap(row => {
    return row.sort((a, b) => a.centerX - b.centerX);
  });

  // 5. 返回排序后的区域（移除中心点信息）
  return sortedRegions.map(({ centerX, centerY, ...region }) => region);
}

/**
 * 优化后的检测算法：使用像素级连通域搜索（BFS）
 * 解决了素材垂直粘连和识别不全的问题
 */
export function detectRange(imageData) {
  const { width, height, data } = imageData;
  // 使用 Uint8Array 标记已访问的像素，性能比 Set 快得多 (0:未访问, 1:已访问)
  const visited = new Uint8Array(width * height);
  const regions = [];

  // 获取背景色（取左上角第一个像素作为基准背景色）
  const bgR = data[0], bgG = data[1], bgB = data[2], bgA = data[3];

  // 颜色容差（防止轻微的噪点或压缩导致背景不纯）
  const tolerance = 15;

  // 判断是否为背景像素的辅助函数
  function isBackground(r, g, b, a) {
    // 如果是完全透明，直接视为背景
    if (a === 0) return true;
    // 如果不透明，检查是否接近背景色
    return Math.abs(r - bgR) < tolerance &&
      Math.abs(g - bgG) < tolerance &&
      Math.abs(b - bgB) < tolerance &&
      Math.abs(a - bgA) < tolerance;
  }

  // 遍历所有像素
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;

      // 如果该像素已被访问过，跳过
      if (visited[index] === 1) continue;

      const pos = index * 4;
      const r = data[pos], g = data[pos + 1], b = data[pos + 2], a = data[pos + 3];

      // 如果发现一个非背景像素，且未访问过，说明发现了一个新物体 -> 开始泛洪填充
      if (!isBackground(r, g, b, a)) {
        // 初始化包围盒
        let minX = x, maxX = x, minY = y, maxY = y;

        //以此像素为起点进行 BFS 广度优先搜索
        const queue = [index];
        visited[index] = 1; // 标记起点

        let pixelCount = 0; // 记录该物体包含的像素数，用于过滤噪点

        while (queue.length > 0) {
          const currIndex = queue.shift(); // 取出队列头部
          pixelCount++;

          const cx = currIndex % width;
          const cy = Math.floor(currIndex / width);

          // 更新包围盒
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // 检查 8 邻域 (上下左右 + 对角线)
          // 如果希望分割得更细（不粘连对角线接触的物体），可以改成 4 邻域
          const neighbors = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0], [1, 0],
            [-1, 1], [0, 1], [1, 1]
          ];

          for (let i = 0; i < neighbors.length; i++) {
            const nx = cx + neighbors[i][0];
            const ny = cy + neighbors[i][1];

            // 边界检查
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIndex = ny * width + nx;

              if (visited[nIndex] === 0) {
                const nPos = nIndex * 4;
                const nr = data[nPos], ng = data[nPos + 1], nb = data[nPos + 2], na = data[nPos + 3];

                // 如果邻居也不是背景，加入队列
                if (!isBackground(nr, ng, nb, na)) {
                  visited[nIndex] = 1; // 标记为已访问，防止重复加入
                  queue.push(nIndex);
                }
              }
            }
          }
        }

        // 过滤极小的噪点（例如像素数小于10 或 宽高太小的）
        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        if (pixelCount > 20 && w > 4 && h > 4) {
          regions.push({
            x: minX,
            y: minY,
            width: w,
            height: h
          });
        }
      }
    }
  }

  return regions;
}

export function isBackgroundColor(r, g, b, a, bgR, bgG, bgB, bgA) {
  const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
  return diff < 60 && Math.abs(a - bgA) < 50;
}
