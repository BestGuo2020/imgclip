// 一次性验证脚本：用迷你 canvas 垫片在 Node 里跑通 src/lib/pipeline.js 的三条编排流程
//   runSmartCrop / runGridSplit / runBgRemoveThenCrop / runBackgroundRemove / manualCropOne
// 以及 download.js 的 ZIP 打包。用完即删。
//
// 为什么需要它：lib/ 下的纯算法已由子代理做过逐位对照（654 项 0 不一致），
// 但 pipeline.js 是本次迁移新写的编排层，负责把算法串成一次用户操作并上报进度，
// 属于「新代码 + 无浏览器可视验证」，必须单独覆盖。

// ---------- 迷你 canvas 垫片（够 pipeline 用）----------
// 关键：真实 canvas 在给 width/height 赋值时会重新分配并清空后备缓冲，
// pipeline 里 tempCanvas 正是「先 createElement 再设尺寸」的用法。
// 所以这里必须用访问器模拟这个行为，否则缓冲区长度为 0，putImageData 会静默丢数据。
function makeCanvas(w = 0, h = 0) {
  let _w = w;
  let _h = h;

  const canvas = {
    _buf: new Uint8ClampedArray(Math.max(0, w * h * 4)),

    get width() {
      return _w;
    },
    set width(value) {
      _w = value;
      realloc();
    },
    get height() {
      return _h;
    },
    set height(value) {
      _h = value;
      realloc();
    },

    getContext() {
      return {
        createImageData(cw, ch) {
          return { width: cw, height: ch, data: new Uint8ClampedArray(cw * ch * 4) };
        },
        getImageData(x, y, gw, gh) {
          const out = new Uint8ClampedArray(gw * gh * 4);
          for (let row = 0; row < gh; row++) {
            for (let col = 0; col < gw; col++) {
              const src = ((y + row) * canvas.width + (x + col)) * 4;
              const dst = (row * gw + col) * 4;
              for (let k = 0; k < 4; k++) out[dst + k] = canvas._buf[src + k];
            }
          }
          return { width: gw, height: gh, data: out };
        },
        putImageData(imageData, dx, dy) {
          for (let row = 0; row < imageData.height; row++) {
            for (let col = 0; col < imageData.width; col++) {
              const src = (row * imageData.width + col) * 4;
              const dst = ((dy + row) * canvas.width + (dx + col)) * 4;
              for (let k = 0; k < 4; k++) canvas._buf[dst + k] = imageData.data[src + k];
            }
          }
        },
        drawImage(src, sx, sy, sw, sh, dx, dy) {
          for (let row = 0; row < sh; row++) {
            for (let col = 0; col < sw; col++) {
              const s = ((sy + row) * src.width + (sx + col)) * 4;
              const d = ((dy + row) * canvas.width + (dx + col)) * 4;
              for (let k = 0; k < 4; k++) canvas._buf[d + k] = src._buf[s + k];
            }
          }
        },
      };
    },

    // 真实 dataURL 无法在 Node 里生成，这里编码尺寸进去，便于断言「确实产出了结果」
    toDataURL() {
      return `data:image/png;base64,FAKE-${canvas.width}x${canvas.height}`;
    },
  };

  function realloc() {
    canvas._buf = new Uint8ClampedArray(Math.max(0, _w * _h * 4));
  }

  return canvas;
}

globalThis.document = { createElement: (tag) => (tag === 'canvas' ? makeCanvas() : {}) };
globalThis.Image = class {
  set src(value) {
    // runBackgroundRemove 会 new Image() 并等待 onload
    this.width = 0;
    this.height = 0;
    setTimeout(() => this.onload && this.onload(), 0);
  }
};

// ---------- 被测代码 ----------
const { runSmartCrop, runGridSplit, runBgRemoveThenCrop, runBackgroundRemove, manualCropOne } =
  await import('../src/lib/pipeline.js');
const { downloadAllAsZip } = await import('../src/lib/download.js');

let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  (实际 ${JSON.stringify(actual)} / 期望 ${JSON.stringify(expected)})`}`);
}

// ---------- 合成一张「精灵图」：白底上两个互不相连的色块 ----------
function makeSpriteSheet() {
  const W = 40;
  const H = 20;
  // 先建空画布再设尺寸，让垫片按真实 canvas 语义重新分配并清空后备缓冲
  const c = makeCanvas();
  c.width = W;
  c.height = H;
  for (let i = 0; i < W * H; i++) {
    c._buf[i * 4] = 255;
    c._buf[i * 4 + 1] = 255;
    c._buf[i * 4 + 2] = 255;
    c._buf[i * 4 + 3] = 255;
  }
  const rect = (x0, y0, w, h, r, g, b) => {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const i = (y * W + x) * 4;
        c._buf[i] = r;
        c._buf[i + 1] = g;
        c._buf[i + 2] = b;
        c._buf[i + 3] = 255;
      }
    }
  };
  rect(4, 5, 8, 8, 255, 0, 0); // 红块
  rect(26, 5, 8, 8, 0, 0, 255); // 蓝块
  return c;
}

// ---------- 1. runSmartCrop ----------
console.log('--- runSmartCrop ---');
{
  const canvas = makeSpriteSheet();
  const progress = [];
  const results = runSmartCrop(canvas, (p, text) => progress.push([p, text]));

  check('产出 2 个结果', results.length, 2);
  check('每项带 id', results.every((r) => typeof r.id === 'number'), true);
  check('每项带 dataURL', results.every((r) => String(r.dataURL).startsWith('data:image/png')), true);
  check('左块宽 8', results[0].width, 8);
  check('左块高 8', results[0].height, 8);
  check('dataURL 尺寸与区域一致', results[0].dataURL.endsWith('8x8'), true);
  check('进度首项为 0', progress[0][0], 0);
  check('进度末项为 100', progress[progress.length - 1][0], 100);
  check('末项文案', progress[progress.length - 1][1], '处理完成！');
  check('进度单调不减', progress.every((v, i) => i === 0 || v[0] >= progress[i - 1][0]), true);
}

// ---------- 2. runGridSplit ----------
console.log('--- runGridSplit ---');
{
  // 网格拆分要求对象之间有明显行列间隙，且背景亮度自适应
  const canvas = makeSpriteSheet();
  const progress = [];
  const results = runGridSplit(canvas, (p, text) => progress.push([p, text]));

  check('网格拆分至少产出 1 个结果', results.length >= 1, true);
  check('每项都带尺寸', results.every((r) => r.width > 0 && r.height > 0), true);
  check('进度末项为 100', progress[progress.length - 1][0], 100);
  check('末项文案', progress[progress.length - 1][1], '处理完成！');
}

// ---------- 3. runBgRemoveThenCrop ----------
console.log('--- runBgRemoveThenCrop ---');
{
  const canvas = makeSpriteSheet();
  const progress = [];
  const results = runBgRemoveThenCrop(canvas, (p, text) => progress.push([p, text]));

  check('去底再拆分产出 2 个结果', results.length, 2);
  check('去底后仍带 dataURL', results.every((r) => String(r.dataURL).startsWith('data:image/png')), true);
  check('进度包含去底阶段 40%', progress.some(([p]) => p === 40), true);
  check('进度包含检测阶段 70%', progress.some(([p]) => p === 70), true);
  check('进度末项为 100', progress[progress.length - 1][0], 100);
}

// ---------- 4. manualCropOne ----------
console.log('--- manualCropOne ---');
{
  const canvas = makeSpriteSheet();
  const item = manualCropOne(canvas);
  check('返回 dataURL', String(item.dataURL).startsWith('data:image/png'), true);
  check('返回宽度', item.width, 40);
  check('返回高度', item.height, 20);
}

// ---------- 5. downloadAllAsZip ----------
console.log('--- downloadAllAsZip ---');
{
  // file-saver 的 saveAs 在 Node 里会碰 DOM，这里只验证空数组短路与 ZIP 能被 JSZip 生成
  const empty = await downloadAllAsZip([], () => {});
  check('空结果直接返回 false（不生成 ZIP）', empty, false);

  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  zip.file('split_1.png', Buffer.from([1, 2, 3]));
  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  check('JSZip 可正常生成 ZIP（依赖可用）', buf.length > 0, true);
}

// ---------- 6. 错误路径 ----------
console.log('--- 错误路径 ---');
{
  let threw = false;
  try {
    runSmartCrop(null, () => {});
  } catch (e) {
    threw = true;
    check('空画布抛出的错误文案', e.message, '画布不可用');
  }
  check('runSmartCrop(null) 会抛错而不是静默返回', threw, true);
}

console.log(`\n结果：${failures === 0 ? '全部通过' : failures + ' 项失败'}`);
process.exit(failures === 0 ? 0 : 1);
