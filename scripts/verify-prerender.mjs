#!/usr/bin/env node
// scripts/verify-prerender.mjs — 断言构建期预渲染的结果真的对
//
// 为什么单独一个脚本：预渲染的产物是「给爬虫看的 HTML」，它在浏览器里看不出问题
// （Vue 一挂载就把静态正文替换掉了），靠肉眼检查 dist 里的文件又容易漏。
// 这里把每一条要求都变成断言，作为 `pnpm build` 的一环，跑不过就构建失败。
//
// 检查项对应的是几类真实事故：
//   - canonical 落在别的语言上 → 该语言页面永远拿不到独立收录；
//   - 语言页里混进中文 → 谷歌判定「语言不一致」，hreflang 白声明；
//   - 静态正文被饿死（#app 空着）→ AI 爬虫读到空页面，丢掉 AI 搜索引用；
//   - hreflang 四份文件不一致 → 集群失效，全部当成重复内容；
//   - dist 里残留 _worker.js → 边缘改写和构建期产物打架，出现第二份真相。

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
Object.defineProperty(globalThis, 'navigator', {
  value: { language: 'zh-CN' },
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'localStorage', {
  value: { getItem: () => null, setItem() {} },
  configurable: true,
  writable: true,
});

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(projectRoot, 'dist');

const { i18n } = await import('../src/i18n.js');
const { SEO_PAGES, HREFLANG_LINKS, OG_IMAGE, FAQ_ITEMS, pageUrl } = await import('../src/seo-pages.js');

let failures = 0;
let checks = 0;

function check(label, actual, expected) {
  checks++;
  if (actual === expected) return;
  failures++;
  console.log(`FAIL  ${label}`);
  console.log(`      实际: ${JSON.stringify(actual)}`);
  console.log(`      期望: ${JSON.stringify(expected)}`);
}

function checkTrue(label, value, hint = '') {
  checks++;
  if (value) return;
  failures++;
  console.log(`FAIL  ${label}${hint ? `（${hint}）` : ''}`);
}

/**
 * 解码 HTML 实体。
 * 预渲染会把文案转义后写进 HTML（`&` → `&amp;`、`"` → `&quot;`），
 * 而这里的期望值来自 i18n 字典的原始字符串 —— 不还原实体就会误报
 * （en 的 title 里正好有一个 `&`）。
 */
function decodeEntities(value) {
  if (value === null || value === undefined) return value;
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** 取 meta 的 content，取不到返回 null */
function metaContent(html, attr, key) {
  const re = new RegExp(`<meta\\b[^>]*\\b${attr}="${key}"[^>]*>`, 'i');
  const tag = html.match(re);
  if (!tag) return null;
  const m = tag[0].match(/\bcontent="([^"]*)"/);
  return m ? decodeEntities(m[1]) : null;
}

/** 取带 id 的 JSON-LD，解析失败返回 null */
function jsonLd(html, id) {
  const re = new RegExp(`<script type="application/ld\\+json" id="${id}">([\\s\\S]*?)</script>`);
  const m = html.match(re);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/** 取静态回退正文的纯文本 */
function staticBodyText(html) {
  const re = /<!--\s*static-fallback:start[\s\S]*?-->([\s\S]*?)<!--\s*static-fallback:end\s*-->/;
  const m = html.match(re);
  if (!m) return null;
  return m[1]
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeBody(value) {
  return value === null ? null : decodeEntities(value);
}

function hreflangBlock(html) {
  return (html.match(/<link\b[^>]*\bhreflang="[^"]*"[^>]*>/g) || [])
    .map((tag) => tag.replace(/\s+/g, ' ').trim())
    .sort();
}

const pages = {};
for (const lang of Object.keys(SEO_PAGES)) {
  const cfg = SEO_PAGES[lang];
  const file = cfg.path === '/' ? join(distDir, 'index.html') : join(distDir, cfg.path.slice(1), 'index.html');
  checkTrue(`dist 里存在 ${lang} 页面`, existsSync(file), file.replace(projectRoot, '.'));
  if (existsSync(file)) pages[lang] = readFileSync(file, 'utf8');
}

const langs = Object.keys(pages);
checkTrue('四种语言都生成了页面', langs.length === 4, `实际 ${langs.length} 个`);

// hreflang 集群：四份文件必须完全一致，且条数与配置相同
const reference = langs.length ? hreflangBlock(pages[langs[0]]) : [];
check('hreflang 条数', reference.length, HREFLANG_LINKS.length);
for (const lang of langs) {
  check(`hreflang 集群一致（${lang}）`, JSON.stringify(hreflangBlock(pages[lang])), JSON.stringify(reference));
}

for (const lang of langs) {
  const html = pages[lang];
  const cfg = SEO_PAGES[lang];
  const url = pageUrl(lang);

  // <html lang> 与 <title>
  const htmlLang = (html.match(/<html\b[^>]*\blang="([^"]*)"/) || [])[1];
  check(`<html lang>（${lang}）`, htmlLang, cfg.htmlLang);

  const title = decodeEntities((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
  const expectedTitle = (i18n.lang = lang, i18n.t('title'));
  check(`title（${lang}）`, title, expectedTitle);

  // canonical 必须自指
  const canonical = (html.match(/<link\b[^>]*\brel="canonical"[^>]*\bhref="([^"]*)"/) || [])[1];
  check(`canonical 自指（${lang}）`, canonical, url);

  // 页面级 meta
  check(`description（${lang}）`, metaContent(html, 'name', 'description'), cfg.description);
  check(`keywords（${lang}）`, metaContent(html, 'name', 'keywords'), cfg.keywords);
  check(`og:url（${lang}）`, metaContent(html, 'property', 'og:url'), url);
  check(`og:title（${lang}）`, metaContent(html, 'property', 'og:title'), cfg.ogTitle);
  check(`og:description（${lang}）`, metaContent(html, 'property', 'og:description'), cfg.ogDescription);
  check(`og:image（${lang}）`, metaContent(html, 'property', 'og:image'), OG_IMAGE.url);
  check(`og:image:width（${lang}）`, metaContent(html, 'property', 'og:image:width'), String(OG_IMAGE.width));
  check(`og:image:height（${lang}）`, metaContent(html, 'property', 'og:image:height'), String(OG_IMAGE.height));
  check(`twitter:image（${lang}）`, metaContent(html, 'name', 'twitter:image'), OG_IMAGE.url);
  check(`robots（${lang}）`, metaContent(html, 'name', 'robots'), 'index,follow');

  // 结构化数据
  const website = jsonLd(html, 'ld-website');
  checkTrue(`ld-website 可解析（${lang}）`, !!website);
  if (website) {
    check(`ld-website.url（${lang}）`, website.url, url);
    check(`ld-website.name（${lang}）`, website.name, (i18n.lang = lang, i18n.t('schema.websiteName')));
  }

  const tool = jsonLd(html, 'ld-tool');
  checkTrue(`ld-tool 可解析（${lang}）`, !!tool);
  if (tool) {
    check(`ld-tool.url（${lang}）`, tool.url, url);
    checkTrue(`ld-tool.featureList 是数组（${lang}）`, Array.isArray(tool.featureList));
    checkTrue(`ld-tool 不含 aggregateRating（${lang}）`, !('aggregateRating' in tool), '自服务评价违反 Google 政策');
  }

  const faq = jsonLd(html, 'ld-faq');
  checkTrue(`ld-faq 可解析（${lang}）`, !!faq);
  if (faq) {
    check(`ld-faq 类型（${lang}）`, faq['@type'], 'FAQPage');
    check(`ld-faq 问题数（${lang}）`, faq.mainEntity?.length, FAQ_ITEMS.length);
    checkTrue(
      `ld-faq 答案已剥标签（${lang}）`,
      faq.mainEntity.every((item) => !/[<>]/.test(item.acceptedAnswer.text || ''))
    );
  }

  // 静态正文：这是给不执行 JS 的爬虫看的那一份
  const body = decodeBody(staticBodyText(html));
  checkTrue(`#app 里有静态正文（${lang}）`, !!body, 'static-fallback 标记之间为空');
  if (body) {
    checkTrue(`静态正文长度合理（${lang}）`, body.length > 800, `实际 ${body.length} 字符`);
    const hasCJK = /[\u4e00-\u9fff]/.test(body);
    if (lang === 'en' || lang === 'ko') {
      checkTrue(`静态正文不含中文字符（${lang}）`, !hasCJK, '多半是 i18n 缺 key 回退到了中文');
    }
    if (lang === 'ja') {
      checkTrue(`静态正文含日文假名（${lang}）`, /[\u3040-\u30ff]/.test(body), '多半是缺翻译');
    }
    if (lang === 'zh-CN') {
      checkTrue('静态正文含中文（zh-CN）', hasCJK);
    }
  }

  // 应用仍然能启动（构建产物里的 bundle 标签不能被预渲染弄丢）
  checkTrue(`保留了 JS 入口（${lang}）`, /<script[^>]+type="module"[^>]+src="[^"]+"/.test(html));
}

// _redirects：语言路径必须显式路由到各自的壳，且**不能**有 catch-all。
// 背景：Pages 在没有顶层 404.html 时自带 SPA 回退（深链会回落到根页），所以
// `/*  /index.html  200` 是多余的；而它一旦生效，就可能把 /assets/*.js、/robots.txt、
// /og.png 改写成 index.html —— 尤其是现在 _worker.js 已退役，不再有 Function 挡在前面。
const redirectsPath = join(distDir, '_redirects');
checkTrue('dist/_redirects 存在', existsSync(redirectsPath));
if (existsSync(redirectsPath)) {
  const rules = readFileSync(redirectsPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  const catchAll = rules.find((line) => line.startsWith('/* '));
  checkTrue('_redirects 不含 /* catch-all 规则', !catchAll, catchAll ? `发现「${catchAll}」` : '');

  for (const cfg of Object.values(SEO_PAGES)) {
    if (cfg.path === '/') continue;
    const p = cfg.path;
    checkTrue(`_redirects 有 ${p} 精确规则`, rules.some((l) => l.startsWith(`${p} `)));
    checkTrue(`_redirects 有 ${p}/* 规则`, rules.some((l) => l.startsWith(`${p}/* `)));
  }
}

// 退役的边缘改写不能残留在产物里
checkTrue('dist/_worker.js 已移除', !existsSync(join(distDir, '_worker.js')));

console.log(
  `\n[verify-prerender] ${checks} 项断言，${failures === 0 ? '全部通过' : `${failures} 项失败`}`
);
process.exit(failures === 0 ? 0 : 1);
