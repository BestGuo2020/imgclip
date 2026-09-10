// 一次性验证脚本：用假 DOM 校验 src/seo.js 的 applySeoMeta 是否把
// title / meta / JSON-LD 写成了正确的值。用完即删。
//
// 为什么需要它：applySeoMeta 的效果在浏览器里不可见（改的是 head 里的 meta，
// 页面快照看不到），而它是迁移中新写的代码，最容易出选择器拼写类错误。

// ---------- 假 DOM ----------
const store = new Map();

function makeEl(init = {}) {
  return {
    attrs: {},
    textContent: init.textContent ?? '',
    getAttribute(name) {
      return this.attrs[name];
    },
    setAttribute(name, value) {
      this.attrs[name] = String(value);
    },
  };
}

// 按 dist/index.html 里真实存在的选择器建元素
const metaSelectors = [
  'meta[property="og:title"]',
  'meta[name="twitter:title"]',
  'meta[name="description"]',
  'meta[name="keywords"]',
  'meta[property="og:description"]',
  'meta[name="twitter:description"]',
];
for (const sel of metaSelectors) store.set(sel, makeEl());

store.set(
  'ld-website',
  makeEl({
    textContent: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: '智能图片裁剪工具',
      url: 'https://imgcrop.guoguo-labs.online',
      description: '免费在线智能图片裁剪工具，支持批量处理、自动识别素材区域、手动裁剪',
    }),
  })
);
store.set(
  'ld-tool',
  makeEl({
    textContent: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Tool',
      name: '智能图片裁剪工具',
      description: '免费在线智能图片裁剪工具…',
      featureList: ['自动识别一张图中的多个独立素材区域'],
      // 静态 JSON-LD 里真实存在、且 applySeoMeta 不该动的字段
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
    }),
  })
);

const byId = { 'ld-website': store.get('ld-website'), 'ld-tool': store.get('ld-tool') };

// Vue 的 runtime-dom 在模块加载期就会探测 DOM（createElement('template') 等），
// 所以假 document 需要提供最小可用的节点工厂。
function makeNode(tag) {
  return {
    tagName: String(tag).toUpperCase(),
    style: {},
    dataset: {},
    children: [],
    innerHTML: '',
    textContent: '',
    classList: { add() {}, remove() {}, contains: () => false },
    setAttribute() {},
    getAttribute: () => null,
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    removeChild() {},
    addEventListener() {},
    removeEventListener() {},
    insertBefore(child) {
      return child;
    },
  };
}

globalThis.document = {
  title: '',
  documentElement: { lang: 'zh-CN' },
  body: makeNode('body'),
  head: makeNode('head'),
  createElement: makeNode,
  createElementNS: (_ns, tag) => makeNode(tag),
  createTextNode: (text) => ({ textContent: String(text) }),
  querySelector(sel) {
    return store.get(sel) || null;
  },
  getElementById(id) {
    return byId[id] || null;
  },
};

globalThis.window = {
  location: { pathname: '/', hash: '', search: '' },
  history: { replaceState() {} },
};

// Node 24 自带只读的 navigator 全局，必须用 defineProperty 覆盖
Object.defineProperty(globalThis, 'navigator', {
  value: { language: 'zh-CN' },
  configurable: true,
  writable: true,
});

const ls = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k) => (ls.has(k) ? ls.get(k) : null),
    setItem: (k, v) => ls.set(k, String(v)),
  },
  configurable: true,
  writable: true,
});

// ---------- 被测代码 ----------
const { applySeoMeta, META_DESCRIPTIONS, META_KEYWORDS, OG_DESCRIPTIONS } = await import(
  '../src/seo.js'
);

let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) {
    console.log(`      实际: ${JSON.stringify(actual)}`);
    console.log(`      期望: ${JSON.stringify(expected)}`);
  }
}

const t = (sel) => store.get(sel).attrs.content;
const ld = (id) => JSON.parse(byId[id].textContent);

// --- 英文 ---
applySeoMeta('en');
console.log('--- applySeoMeta("en") ---');
check('document.title', document.title, 'Smart Image Splitter - Auto Crop & Extract Sprites Online');
check('og:title', t('meta[property="og:title"]'), document.title);
check('twitter:title', t('meta[name="twitter:title"]'), document.title);
check('description', t('meta[name="description"]'), META_DESCRIPTIONS.en);
check('keywords', t('meta[name="keywords"]'), META_KEYWORDS.en);
check('og:description', t('meta[property="og:description"]'), OG_DESCRIPTIONS.en);
check('twitter:description', t('meta[name="twitter:description"]'), OG_DESCRIPTIONS.en);

const wEn = ld('ld-website');
check('ld-website.name', wEn.name, 'Smart Image Splitter');
check('ld-website.description', wEn.description, wEn.description);
check('ld-website URL 未被改动', wEn.url, 'https://imgcrop.guoguo-labs.online');
check('ld-website @type 保留', wEn['@type'], 'WebSite');

const toolEn = ld('ld-tool');
check('ld-tool.name', toolEn.name, 'Smart Image Splitter');
check('ld-tool featureList 是数组', Array.isArray(toolEn.featureList), true);
check('ld-tool featureList 5 项', toolEn.featureList.length, 5);
// 自服务评价（aggregateRating）已从静态 JSON-LD 中移除：Google 结构化数据政策
// 不允许站点给自己的工具打星，保留它只会丢富媒体结果资格。
check('ld-tool 不含 aggregateRating', 'aggregateRating' in toolEn, false);
check('ld-tool offers 保留', toolEn.offers.price, '0');
check('ld-tool @type 保留', toolEn['@type'], 'Tool');

// --- 韩文（换语言要覆盖，不能残留英文）---
applySeoMeta('ko');
console.log('--- applySeoMeta("ko") ---');
check('description 切到韩文', t('meta[name="description"]'), META_DESCRIPTIONS.ko);
check('keywords 切到韩文', t('meta[name="keywords"]'), META_KEYWORDS.ko);
check('ld-tool featureList 切到韩文 5 项', ld('ld-tool').featureList.length, 5);
check('韩文 featureList 首项', ld('ld-tool').featureList[0], '이미지 내의 여러 독립 개체 자동 감지');

// --- 中文 ---
applySeoMeta('zh-CN');
console.log('--- applySeoMeta("zh-CN") ---');
check('description 回到中文', t('meta[name="description"]'), META_DESCRIPTIONS['zh-CN']);
// 注意：这里期望的是 i18n 的 schema.websiteName（'智能图片素材拆分工具'），
// 而不是 index.html 静态 JSON-LD 里写的 '智能图片裁剪工具'。
// 迁移前的 applyI18n() 同样会用 i18n 的值覆盖静态值，这里保持一致。
check('ld-website.name 回到中文', ld('ld-website').name, '智能图片素材拆分工具');

// --- i18n.lang 不应被 applySeoMeta 改坏 ---
const { i18n } = await import('../src/i18n.js');
check('applySeoMeta 结束后 i18n.lang 未泄漏', i18n.lang, 'zh-CN');

console.log(`\n结果：${failures === 0 ? '全部通过' : failures + ' 项失败'}`);
process.exit(failures === 0 ? 0 : 1);
