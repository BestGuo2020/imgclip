// src/lib/bgremove.js
// 来源文件：imgcrop/script.js（逐行等价抽取，仅做模块化）
// 抽取范围（原脚本行号）：
//   commonBgColors                  (748-753)
//   removeBackgroundFloodFill       (957-1037)
//   detectBorderBackgroundColor     (1043-1089)
//   detectBackgroundColor           (1092-1126)
//   isSimilarColor                  (1129-1141)
//   cleanEdges                      (1200-1248)
//   removeSpeckles                  (1255-1306)
// 未做任何算法参数调整：容差 30 / 60 / 50、bin=5、minSize=20、step=1 等全部原样保留。
// 本模块不 import 其它模块（commonBgColors 就地保留）。

// 针对游戏素材的常见背景色列表
export const commonBgColors = [
  { r: 192, g: 176, b: 144, a: 255 }, // 浅棕色（游戏素材常见背景）
  { r: 255, g: 255, b: 255, a: 255 }, // 白色
  { r: 0, g: 0, b: 0, a: 255 },       // 黑色
  { r: 128, g: 128, b: 128, a: 255 }  // 灰色
];

/**
 * 核心去底算法：边缘采样 + 泛洪填充 (Flood Fill)
 * 优点：保护物体内部颜色，只去除外部连通背景
 */
export function removeBackgroundFloodFill(imageData, bgColor) {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height); // 标记已处理像素

  // 2. 初始化队列，将图像四周的像素加入种子队列
  const queue = [];

  // 定义容差 (0-255)，对于 JPG 压缩图，建议 20-40，PNG 原图可以 10
  // 你之前的代码针对某特定颜色用了超大容差，这里我们使用动态容差
  const tolerance = 30;

  // 辅助：检查颜色是否匹配背景
  function isMatch(idx) {
    const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
    // 欧氏距离计算颜色差异
    const diff = Math.sqrt(
      Math.pow(r - bgColor.r, 2) +
      Math.pow(g - bgColor.g, 2) +
      Math.pow(b - bgColor.b, 2)
    );
    return diff <= tolerance && Math.abs(a - bgColor.a) <= tolerance;
  }

  // 扫描上下左右四条边
  for (let x = 0; x < width; x++) {
    addSeed(x, 0);            // Top
    addSeed(x, height - 1);   // Bottom
  }
  for (let y = 0; y < height; y++) {
    addSeed(0, y);            // Left
    addSeed(width - 1, y);    // Right
  }

  // 注：原文件中 addSeed 写在调用点之后，依赖函数声明提升；此处保持原顺序与原语义。
  function addSeed(x, y) {
    const idx = (y * width + x);
    if (visited[idx]) return;

    const pos = idx * 4;
    if (isMatch(pos)) {
      queue.push(idx);
      visited[idx] = 1;
    }
  }

  // 3. 开始泛洪填充 (BFS)
  // 只有与边缘背景连通的像素才会被变成透明
  while (queue.length > 0) {
    const currIdx = queue.shift();
    const cx = currIdx % width;
    const cy = Math.floor(currIdx / width);

    // 将当前像素设为透明
    const pos = currIdx * 4;
    data[pos] = 0;
    data[pos + 1] = 0;
    data[pos + 2] = 0;
    data[pos + 3] = 0;

    // 检查 4 邻域
    const neighbors = [
      { x: cx, y: cy - 1 }, // Up
      { x: cx, y: cy + 1 }, // Down
      { x: cx - 1, y: cy }, // Left
      { x: cx + 1, y: cy }  // Right
    ];

    for (const n of neighbors) {
      if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
        const nIdx = n.y * width + n.x;
        if (visited[nIdx] === 0) {
          const nPos = nIdx * 4;
          // 如果邻居颜色也接近背景色，加入队列继续腐蚀
          if (isMatch(nPos)) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
      }
    }
  }
}

/**
 * 优化后的背景色检测：只统计图片边缘一圈的像素
 * 防止把物体主体颜色误判为背景
 */
export function detectBorderBackgroundColor(imageData) {
  const { width, height, data } = imageData;
  const colorCounts = {};
  let maxCount = 0;
  let bestColor = { r: 0, g: 0, b: 0, a: 0 }; // 默认

  // 辅助统计函数
  function countPixel(x, y) {
    const i = (y * width + x) * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

    // 忽略已经完全透明的像素
    if (a === 0) return;

    // 简单的量化键值 (降低精度以聚合相似颜色)
    // 例如：将 255 种颜色压缩到 51 个桶，容忍噪点
    const bin = 5;
    const key = `${Math.floor(r / bin)},${Math.floor(g / bin)},${Math.floor(b / bin)}`;

    if (!colorCounts[key]) {
      colorCounts[key] = { count: 0, r, g, b, a };
    }
    colorCounts[key].count++;

    if (colorCounts[key].count > maxCount) {
      maxCount = colorCounts[key].count;
      bestColor = { r: colorCounts[key].r, g: colorCounts[key].g, b: colorCounts[key].b, a: colorCounts[key].a };
    }
  }

  // 扫描四条边
  // 步长 step 可以设为 1，如果图很大可以设为 2 或 4 提高性能
  const step = 1;

  // Top & Bottom
  for (let x = 0; x < width; x += step) {
    countPixel(x, 0);
    countPixel(x, height - 1);
  }
  // Left & Right
  for (let y = 1; y < height - 1; y += step) {
    countPixel(0, y);
    countPixel(width - 1, y);
  }

  return bestColor;
}

// 检测背景色（优化算法：分析整个图片的像素分布）
export function detectBackgroundColor(imageData) {
  const { width, height, data } = imageData;
  const colorCounts = {};
  let maxCount = 0;
  let mostCommonColor = { r: 255, g: 255, b: 255, a: 255 };

  // 分析整个图片的像素分布
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // 跳过完全透明的像素
    if (a === 0) continue;

    const key = `${r},${g},${b}`; // 忽略alpha通道，只考虑RGB
    colorCounts[key] = (colorCounts[key] || 0) + 1;

    if (colorCounts[key] > maxCount) {
      maxCount = colorCounts[key];
      mostCommonColor = { r, g, b, a };
    }
  }

  // 检查是否匹配常见背景色
  for (const commonColor of commonBgColors) {
    const key = `${commonColor.r},${commonColor.g},${commonColor.b}`;
    if (colorCounts[key] && colorCounts[key] > maxCount * 0.5) {
      return commonColor;
    }
  }

  return mostCommonColor;
}

// 检测两个颜色是否相似（优化版本）
export function isSimilarColor(r1, g1, b1, a1, r2, g2, b2, a2, tolerance) {
  // 针对游戏素材的背景色，使用更宽松的阈值
  if (r2 === 192 && g2 === 176 && b2 === 144) {
    // 游戏素材常见浅棕色背景，使用更宽松的阈值
    const colorDiff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    return colorDiff < tolerance * 4;
  }

  // 普通颜色比较
  const colorDiff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
  const alphaDiff = Math.abs(a1 - a2);
  return colorDiff < tolerance * 3 && alphaDiff < tolerance;
}

/**
 * 后处理步骤1：边缘净化（腐蚀算法）
 * 作用：扫描所有“不透明但接触透明区域”的边缘像素，如果颜色接近背景色，强制删除。
 * 解决：图中的边缘杂色环
 */
export function cleanEdges(imageData, bgColor, tolerance = 50) {
  const { width, height, data } = imageData;
  // 复制一份数据用于检测邻居，防止处理过程中影响判断
  const oldData = new Uint8Array(data);

  let deletedCount = 0;

  // 辅助：获取某个位置的 alpha 值
  const getAlpha = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    return oldData[(y * width + x) * 4 + 3];
  };

  // 辅助：计算颜色差异
  const getColorDiff = (i) => {
    const r = oldData[i], g = oldData[i + 1], b = oldData[i + 2];
    return Math.sqrt(
      Math.pow(r - bgColor.r, 2) +
      Math.pow(g - bgColor.g, 2) +
      Math.pow(b - bgColor.b, 2)
    );
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // 只有当前像素不透明时才处理
      if (oldData[idx + 3] > 0) {
        // 检查 4 邻域是否有透明像素（说明这是边缘）
        const isEdge =
          getAlpha(x, y - 1) === 0 ||
          getAlpha(x, y + 1) === 0 ||
          getAlpha(x - 1, y) === 0 ||
          getAlpha(x + 1, y) === 0;

        if (isEdge) {
          // 如果是边缘，且颜色还挺像背景的（使用比泛洪填充更大的容差），删掉！
          if (getColorDiff(idx) < tolerance) {
            data[idx + 3] = 0; // 变透明
            deletedCount++;
          }
        }
      }
    }
  }
  // 如果处理了很多像素，说明边缘很脏，可以递归再洗一遍（可选）
  // if (deletedCount > 0) cleanEdges(imageData, bgColor, tolerance);
}

/**
 * 后处理步骤2：去除孤立噪点（连通域过滤）
 * 作用：如果有一团像素小于 N 个（比如小于20个像素），视为噪点直接删除
 * 解决：图一图二角落里的那些残留小点
 */
export function removeSpeckles(imageData, minSize = 20) {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      // 如果该像素不透明且未访问，开始计算这个物体的面积
      if (data[idx * 4 + 3] > 0 && visited[idx] === 0) {
        const queue = [idx];
        visited[idx] = 1;
        const componentIndices = [idx]; // 记录这个物体包含的所有像素索引

        let ptr = 0;
        while (ptr < queue.length) {
          const curr = queue[ptr++];
          const cx = curr % width;
          const cy = Math.floor(curr / width);

          // 8邻域搜索（连在一起就算一个物体）
          const neighbors = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0], [1, 0],
            [-1, 1], [0, 1], [1, 1]
          ];

          for (const n of neighbors) {
            const nx = cx + n[0];
            const ny = cy + n[1];
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              // 如果邻居不透明且未访问
              if (data[nIdx * 4 + 3] > 0 && visited[nIdx] === 0) {
                visited[nIdx] = 1;
                queue.push(nIdx);
                componentIndices.push(nIdx);
              }
            }
          }
        }

        // 核心逻辑：如果这个物体太小（比如只是角落的几个噪点），全部抹除
        if (componentIndices.length < minSize) {
          for (const i of componentIndices) {
            data[i * 4 + 3] = 0; // 设为透明
          }
        }
      }
    }
  }
}
