#!/usr/bin/env node
// scripts/verify-i18n.mjs — 断言四种语言的文案字典「键完全对齐」
//
// 为什么需要它：src/i18n.js 的 t() 在缺 key 时会**静默回退到中文**
// （messages[lang][key] ?? messages['zh-CN'][key] ?? key）。
// 这个兜底在界面上很友好，但它会把「翻译没做完」这件事藏起来：
// 页面看起来正常，实际英文页/日文页里混着中文段落 —— 对出海站点来说，
// 这既毁掉语言信号（谷歌按页面语言判质量、hreflang 声明的和页面内容不一致），
// 也让用户第一眼就不信任。
//
// 因此这里把「静默回退」变成构建期硬失败：任何语言缺任何 key 都不许构建通过。
// 已知的字面量差异（例如中日文里都写 'ImgCrop'）不在检查范围内 —— 只查键，不查值。

import { fileURLToPath } from 'node:url';

void fileURLToPath;

// 与 prerender.mjs 相同的假 DOM：读 src/i18n.js 需要它
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
  querySelector: () => null,
  getElementById: () => null,
};
globalThis.window = { location: { pathname: '/', hash: '', search: '' }, history: { replaceState() {} } };
Object.defineProperty(globalThis, 'navigator', { value: { language: 'zh-CN' }, configurable: true, writable: true });
Object.defineProperty(globalThis, 'localStorage', {
  value: { getItem: () => null, setItem() {} },
  configurable: true,
  writable: true,
});

const { i18n, LANGS } = await import('../src/i18n.js');
const { FAQ_ITEMS } = await import('../src/seo-pages.js');

/** 静态正文 + 结构化数据用到的全部 key —— 这些缺一个，对应语言页面就会混进中文 */
const REQUIRED = [
  'nav.home',
  'nav.features',
  'nav.scene',
  'nav.faq',
  'title',
  'subtitle',
  'demo.step1',
  'demo.step2',
  'demo.step3',
  'upload.text',
  'upload.sub',
  'privacy.badge',
  ...[1, 2, 3].flatMap((n) => [`f.title.${n}`, `f.desc.${n}`]),
  'seo.title',
  'seo.p1',
  'seo.h3.1',
  'seo.p2',
  'seo.h3.2',
  'seo.p3',
  'faq.title',
  ...FAQ_ITEMS.flatMap(({ q, a }) => [q, a]),
  'copyright',
  'schema.websiteName',
  'schema.websiteDesc',
  'schema.toolDesc',
  'schema.featureList',
];

const BASE = 'zh-CN';
const zhValue = (key) => {
  i18n.lang = BASE;
  return i18n.t(key);
};

let failures = 0;

for (const lang of LANGS) {
  if (lang === BASE) continue;

  // t() 的回退链是 lang → zh-CN → key 本身，所以「返回值等于中文」或「返回值等于 key」
  // 就是缺翻译的判据。注意像 demo.step1 里的 emoji 前缀不影响判断，键缺失才会计入。
  const missing = REQUIRED.filter((key) => {
    i18n.lang = lang;
    const value = i18n.t(key);
    return value === key || value === zhValue(key);
  });

  if (missing.length) {
    failures += missing.length;
    console.log(`FAIL  ${lang} 缺 ${missing.length} 个 key（页面会显示中文）：`);
    for (const key of missing) console.log(`        - ${key}`);
  } else {
    console.log(`PASS  ${lang} 文案完整（${REQUIRED.length} 个 key）`);
  }
}

console.log(`\n[verify-i18n] ${failures === 0 ? '全部通过' : `${failures} 个 key 缺失`}`);
process.exit(failures === 0 ? 0 : 1);
