// 一次性验证脚本：不依赖浏览器，直接用 Node 验证
//   public/wasm/imgcrop.wasm 能被 initImgProc() 加载，且 analyze() 的
//   连通域检测与带掩码裁剪结果正确。用完即删。
//
// 为什么需要它：WASM 加载失败时 imgproc.js 会静默回退到纯 JS（只打一条 warn），
// 功能仍然可用但性能下降，属于「不报错但变差」的回归，必须单独验证。

// initImgProc() 内部用 fetch('/wasm/imgcrop.wasm')，Node 里把 fetch 换成读本地文件
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  if (String(url).includes('imgcrop.wasm')) {
    const { readFileSync } = await import('node:fs');
    const buf = readFileSync(new URL('../public/wasm/imgcrop.wasm', import.meta.url));
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    };
  }
  return realFetch(url);
};

const { initImgProc, analyze, usingWasm } = await import('../src/lib/imgproc.js');

let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  (实际 ${actual} / 期望 ${expected})`}`);
}

// ---------- 1. 加载 WASM ----------
const ready = await initImgProc();
check('initImgProc() 返回 true（WebAssembly 可用）', ready, true);
check('usingWasm() 为 true（没有静默回退到 JS）', usingWasm(), true);

// ---------- 2. 构造合成图：白底 + 两个互不相连的红色方块 ----------
const W = 24;
const H = 14;
const data = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i++) {
  data[i * 4] = 255;
  data[i * 4 + 1] = 255;
  data[i * 4 + 2] = 255;
  data[i * 4 + 3] = 255;
}
function fillRect(x0, y0, w, h, r, g, b) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (y * W + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
}
// 两个 6x6 的红色方块：面积 36 > minPixels(20)，边长 6 > minW/minH(4)
fillRect(2, 3, 6, 6, 255, 0, 0);
fillRect(14, 3, 6, 6, 255, 0, 0);

const imageData = { width: W, height: H, data };

// ---------- 3. 检测 ----------
const session = analyze(imageData); // 默认 tolerance=15, minPixels=20, minW=4, minH=4
check('检测到 2 个连通域', session.regions.length, 2);
check('返回的 width 与输入一致', session.width, W);
check('返回的 height 与输入一致', session.height, H);

if (session.regions.length === 2) {
  const [a, b] = session.regions;
  // 视觉顺序排序：上到下、左到右，所以左边的应排在前面
  check('区域按视觉顺序排序（左块在前）', a.x < b.x, true);
  check('左块 x', a.x, 2);
  check('左块 y', a.y, 3);
  check('左块宽', a.width, 6);
  check('左块高', a.height, 6);
  check('右块 x', b.x, 14);
  check('右块宽', b.width, 6);
  check('每块都带 label（crop 依赖它）', typeof a.label === 'number' && typeof b.label === 'number', true);

  // ---------- 4. 带掩码裁剪 ----------
  const pixels = session.crop(a);
  check('裁剪结果字节数 = 6*6*4', pixels.length, 144);
  check('裁剪结果是不透明红色', `${pixels[0]},${pixels[1]},${pixels[2]},${pixels[3]}`, '255,0,0,255');
}

// ---------- 5. 掩码语义：包围盒内不属于该连通域的像素应被置为透明 ----------
// 构造：L 形连通域，其包围盒右下角是背景，裁剪后该处必须透明。
// 注意 L 的像素数必须超过默认 minPixels=20，否则会被当成噪点过滤掉
//（12 像素的 L 会被正确丢弃，这本身是算法预期行为）。
{
  const w2 = 16;
  const h2 = 16;
  const d2 = new Uint8ClampedArray(w2 * h2 * 4);
  for (let i = 0; i < w2 * h2; i++) {
    d2[i * 4] = 0;
    d2[i * 4 + 1] = 0;
    d2[i * 4 + 2] = 0;
    d2[i * 4 + 3] = 0; // 全透明视为背景
  }
  const put = (x, y) => {
    const i = (y * w2 + x) * 4;
    d2[i] = 255;
    d2[i + 1] = 0;
    d2[i + 2] = 0;
    d2[i + 3] = 255;
  };
  // 横边 y=1, x=1..12（12 像素）+ 竖边 x=1, y=1..12（12 像素），重叠 1 个 → 共 23 像素
  for (let x = 1; x <= 12; x++) put(x, 1);
  for (let y = 1; y <= 12; y++) put(1, y);

  const s2 = analyze({ width: w2, height: h2, data: d2 });
  check('L 形连通域被检测到（23 像素 > minPixels 20）', s2.regions.length, 1);

  const region = s2.regions[0];
  if (region) {
    check('L 的包围盒宽度', region.width, 12);
    check('L 的包围盒高度', region.height, 12);

    const cropped = s2.crop(region);
    // 包围盒右下角是背景，必须是透明
    const di = ((region.height - 1) * region.width + (region.width - 1)) * 4;
    check('L 形包围盒的空白角被置为透明（掩码生效）', cropped[di + 3], 0);
    // 包围盒左上角属于连通域，必须不透明
    check('L 形包围盒内的实体像素保留', cropped[3], 255);
    // 包围盒右上角（横向边的末端）属于连通域，必须不透明
    const ri = (0 * region.width + (region.width - 1)) * 4;
    check('L 形包围盒右上角（横边末端）保留', cropped[ri + 3], 255);
  }
}

console.log(`\n结果：${failures === 0 ? '全部通过' : failures + ' 项失败'}`);
process.exit(failures === 0 ? 0 : 1);
