#!/usr/bin/env node
// scripts/prerender.mjs — 构建期为每种语言生成真正带正文的静态 HTML
//
// 为什么必须有这一步（这是本站 SEO 最关键的一次改动）：
//   Vite 打出来的是「单页壳」：/en /ja /ko 过去完全靠浏览器端 JS 渲染，meta 由
//   public/_worker.js 在 Cloudflare 边缘用 HTMLRewriter 改写。这带来两个真实后果：
//     1. 不执行 JS 的爬虫（GPTBot / PerplexityBot / ClaudeBot / CCBot 等 AI 爬虫，
//        以及大部分社媒/IM 的预览抓取）在 /en 上只能读到**中文正文**，
//        等于把「AI 搜索引用」这条渠道整条丢掉；而这些爬虫不会执行 JS，改前端没用。
//     2. 边缘改写是运行时的黑盒：线上到底生效了没有、canonical 改成什么了，
//        本地无法断言，出问题只能等收录掉了才发现。
//   预渲染把它们变成磁盘上真实存在的 HTML：静态直出、可断言、可回归。
//
// 输出（路径与 src/seo-pages.js 的 SEO_PAGES[lang].path 一一对应）：
//   dist/index.html       中文（模板本身，同时被一致性校正）
//   dist/en/index.html    英文
//   dist/ja/index.html    日文
//   dist/ko/index.html    韩文
// Cloudflare Pages 会为 /en 这类请求直接返回 dist/en/index.html，无需任何边缘逻辑。
//
// 文案唯一来源是 src/i18n.js 与 src/seo-pages.js，本脚本只负责「结构」，
// 因此改文案不需要动这里，改页面结构才需要。

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(projectRoot, 'dist');
const templatePath = join(distDir, 'index.html');

if (!existsSync(templatePath)) {
  console.error('[prerender] 找不到 dist/index.html，请先执行 vite build');
  process.exit(1);
}

// ---------------------------------------------------------------- 最小假 DOM
// src/i18n.js 在模块加载期就会执行 detectLang()（读 window.location / localStorage /
// navigator），@vue/runtime-dom 也会探测 document。这里的替身与 scripts/verify-seo.mjs
// 里的那套一致 —— 那份脚本已经证明这套桩足够让 vue 在 Node 里加载。
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

Object.defineProperty(globalThis, 'localStorage', {
  value: { getItem: () => null, setItem() {} },
  configurable: true,
  writable: true,
});

const { i18n } = await import('../src/i18n.js');
const { SEO_PAGES, HREFLANG_LINKS, OG_IMAGE, OG_LOCALE, FAQ_ITEMS, pageUrl, stripHtml } =
  await import('../src/seo-pages.js');
// buildFaqJsonLd 与浏览器端共用，保证结构化数据与页面问答同源
const { buildFaqJsonLd } = await import('../src/seo.js');

// ---------------------------------------------------------------- HTML 工具

function escapeText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  return escapeText(value).replace(/"/g, '&quot;');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 插入到 </head> 之前 */
function insertInHead(html, snippet) {
  if (!html.includes('</head>')) throw new Error('模板里没有 </head>');
  return html.replace('</head>', `${snippet}</head>`);
}

/**
 * 改写或补齐一个 meta 标签。
 * 模板里的 meta 一律是「name/property 在前、content 在后」，但为了容错，
 * 这里按标签整体匹配后再替换 content 的值。
 */
function setMeta(html, attr, key, content) {
  if (content === undefined || content === null || content === '') return html;
  const tagRe = new RegExp(`<meta\\b[^>]*\\b${attr}="${escapeRegExp(key)}"[^>]*>`, 'i');
  const found = html.match(tagRe);
  const value = escapeAttr(content);

  if (found) {
    const tag = /\bcontent="/.test(found[0])
      ? found[0].replace(/\bcontent="[^"]*"/, `content="${value}"`)
      : found[0].replace(/\s*\/?>$/, ` content="${value}">`);
    return html.replace(found[0], tag);
  }
  return insertInHead(html, `    <meta ${attr}="${key}" content="${value}">\n`);
}

function setLink(html, rel, href) {
  const tagRe = new RegExp(`<link\\b[^>]*\\brel="${escapeRegExp(rel)}"[^>]*>`, 'i');
  const found = html.match(tagRe);
  const tag = `<link rel="${rel}" href="${escapeAttr(href)}">`;
  if (found) return html.replace(found[0], tag);
  return insertInHead(html, `    ${tag}\n`);
}

/**
 * 重写 hreflang 集群。
 * 先把模板里已有的 hreflang 行全部删掉，再从 HREFLANG_LINKS 统一生成 —— 这样四份
 * HTML 与 sitemap 的集群不可能出现「改了一处漏了一处」的漂移。
 */
function setHreflang(html) {
  // 注意结尾只吃掉「本行」的空白与换行：如果写成 \s*\n? 会把下一行 canonical 的缩进
  // 一起吃掉，产物里 canonical 就顶格了（虽然不影响功能，但产物应该保持可读）。
  const stripped = html.replace(/[ \t]*<link\b[^>]*\bhreflang="[^"]*"[^>]*>[ \t]*\r?\n?/g, '');
  const block = HREFLANG_LINKS.map(
    ({ hreflang, lang }) =>
      `    <link rel="alternate" hreflang="${hreflang}" href="${escapeAttr(pageUrl(lang))}">`
  ).join('\n');
  const canonicalRe = /[ \t]*<link\b[^>]*\brel="canonical"[^>]*>/;
  if (canonicalRe.test(stripped)) {
    return stripped.replace(canonicalRe, (m) => `${block}\n${m}`);
  }
  return insertInHead(stripped, `${block}\n`);
}

/** 替换带 id 的 JSON-LD；不存在则新建 */
function setJsonLd(html, id, data) {
  const re = new RegExp(
    `(<script type="application/ld\\+json" id="${escapeRegExp(id)}">)[\\s\\S]*?(</script>)`
  );
  // 缩进一下，让产物里的结构化数据保持可读（排查收录问题时经常要直接看它）
  const json = JSON.stringify(data, null, 4)
    .split('\n')
    .map((line, index) => (index === 0 ? line : `    ${line}`))
    .join('\n');
  if (re.test(html)) return html.replace(re, `$1\n${json}\n    $2`);
  return insertInHead(html, `    <script type="application/ld+json" id="${id}">\n${json}\n    </script>\n`);
}

/** 替换 #app 里的静态回退正文（靠 index.html 里的成对标记定位，避免正则去配嵌套 div） */
function setStaticBody(html, bodyHtml) {
  const re = /(<!--\s*static-fallback:start[\s\S]*?-->)([\s\S]*?)(<!--\s*static-fallback:end\s*-->)/;
  if (!re.test(html)) {
    throw new Error(
      'index.html 里找不到 static-fallback:start / :end 标记，无法注入静态正文（标记被删了？）'
    );
  }
  return html.replace(
    re,
    (_m, start, _body, end) => `${start}\n${bodyHtml}\n            ${end}`
  );
}

// ---------------------------------------------------------------- 正文渲染

/**
 * 生成某一语言的静态回退正文。
 * 结构与真实页面一致（导航 / 标题 / 上传区 / 功能 / 场景 / FAQ / 页脚），
 * 但用纯 HTML 写死，不依赖 Vue —— 这正是给「不执行 JS 的爬虫」看的那一份。
 * 文案全部来自 i18n 字典；答案按 HTML 片段渲染（faq.a6 含 <br>，与 FaqSection.vue 的 v-html 一致）。
 */
function renderStaticBody(t) {
  const features = [1, 2, 3]
    .map(
      (n) => `                    <div>
                        <h3>${escapeText(t(`f.title.${n}`))}</h3>
                        <p>${escapeText(t(`f.desc.${n}`))}</p>
                    </div>`
    )
    .join('\n');

  const faq = FAQ_ITEMS.map(
    ({ q, a }) => `                    <details>
                        <summary>${escapeText(t(q))}</summary>
                        <p>${t(a)}</p>
                    </details>`
  ).join('\n');

  return `            <div class="static-fallback">
                <nav>
                    <a href="#"><span>✂️</span> ImgCrop</a>
                    <ul>
                        <li><a href="#">${escapeText(t('nav.home'))}</a></li>
                        <li><a href="#features">${escapeText(t('nav.features'))}</a></li>
                        <li><a href="#seo-content">${escapeText(t('nav.scene'))}</a></li>
                        <li><a href="#faq">${escapeText(t('nav.faq'))}</a></li>
                    </ul>
                </nav>

                <header>
                    <h1 class="page-title">${escapeText(t('title'))}</h1>
                    <p>${escapeText(t('subtitle'))}</p>
                </header>

                <section>
                    <div>${escapeText(t('demo.step1'))}</div>
                    <div>${escapeText(t('demo.step2'))}</div>
                    <div>${escapeText(t('demo.step3'))}</div>
                    <h2>${escapeText(t('upload.text'))}</h2>
                    <p>${escapeText(t('upload.sub'))}</p>
                    <p>${escapeText(t('privacy.badge'))}</p>
                </section>

                <section id="features">
${features}
                </section>

                <section id="seo-content">
                    <h2>${escapeText(t('seo.title'))}</h2>
                    <p>${escapeText(t('seo.p1'))}</p>
                    <h3>${escapeText(t('seo.h3.1'))}</h3>
                    <p>${escapeText(t('seo.p2'))}</p>
                    <h3>${escapeText(t('seo.h3.2'))}</h3>
                    <p>${escapeText(t('seo.p3'))}</p>
                </section>

                <section id="faq">
                    <h2>${escapeText(t('faq.title'))}</h2>
${faq}
                </section>

                <footer>
                    <p>${escapeText(t('copyright'))}</p>
                </footer>
            </div>`;
}

// ---------------------------------------------------------------- 主流程

/** 静态正文里出现的所有 i18n key（用于「疑似未翻译」检查） */
const BODY_KEYS = [
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
];

/**
 * 取词函数工厂。
 * 关键点：i18n.lang 是**全局状态**，所以每次取值前都要重新设置语言 ——
 * 不能只在工厂被调用时设置一次（那样第二次调用工厂就会把语言改掉，
 * 后面所有 t() 都会串到那个语言上，曾导致 en 页面的 title 变成中文）。
 */
function tFactory(lang) {
  return (key) => {
    i18n.lang = lang;
    return i18n.t(key);
  };
}

/** 取数组类文案（如 schema.featureList），同样每次先把语言设置好 */
function listFactory(lang) {
  return (key) => {
    i18n.lang = lang;
    return i18n.list(key);
  };
}

function buildPage(template, lang) {
  const cfg = SEO_PAGES[lang];
  if (!cfg) throw new Error(`seo-pages.js 里没有语言 ${lang} 的配置`);

  const t = tFactory(lang);
  const list = listFactory(lang);
  const zhT = tFactory('zh-CN');
  const url = pageUrl(lang);
  const title = t('title');

  let html = template;

  // <html lang> 与 <title>
  html = html.replace(/<html\b[^>]*>/, `<html lang="${escapeAttr(cfg.htmlLang)}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeText(title)}</title>`);

  // 基础 meta
  html = setMeta(html, 'name', 'description', cfg.description);
  html = setMeta(html, 'name', 'keywords', cfg.keywords);
  html = setMeta(html, 'name', 'robots', 'index,follow');

  // Open Graph / Twitter Card
  html = setMeta(html, 'property', 'og:type', 'website');
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:title', cfg.ogTitle);
  html = setMeta(html, 'property', 'og:description', cfg.ogDescription);
  html = setMeta(html, 'property', 'og:site_name', 'ImgCrop');
  html = setMeta(html, 'property', 'og:locale', OG_LOCALE[lang]);
  html = setMeta(html, 'property', 'og:image', OG_IMAGE.url);
  html = setMeta(html, 'property', 'og:image:width', String(OG_IMAGE.width));
  html = setMeta(html, 'property', 'og:image:height', String(OG_IMAGE.height));
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = setMeta(html, 'name', 'twitter:title', cfg.ogTitle);
  html = setMeta(html, 'name', 'twitter:description', cfg.ogDescription);
  html = setMeta(html, 'name', 'twitter:image', OG_IMAGE.url);

  // canonical 必须指向自己：过去 /en 的 canonical 落在根路径上，
  // 结果是英文页被当成中文页的重复内容，永远拿不到独立收录。
  html = setLink(html, 'canonical', url);
  html = setHreflang(html);

  // 结构化数据
  html = setJsonLd(html, 'ld-website', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('schema.websiteName'),
    url,
    description: t('schema.websiteDesc'),
  });

  html = setJsonLd(html, 'ld-tool', {
    '@context': 'https://schema.org',
    '@type': 'Tool',
    name: t('schema.websiteName'),
    description: t('schema.toolDesc'),
    url,
    image: OG_IMAGE.url,
    author: { '@type': 'Person', name: 'BestGuo2020' },
    publisher: { '@type': 'Organization', name: 'BestGuo2020' },
    dateCreated: '2025-01-01',
    dateModified: '2025-12-01',
    softwareVersion: '1.0.0',
    operatingSystem: 'All',
    applicationCategory: 'ImageEditing',
    offers: { '@type': 'Offer', price: '0', priceCurrency: lang === 'zh-CN' ? 'CNY' : 'USD' },
    featureList: list('schema.featureList'),
    // 这里刻意不输出 aggregateRating：写死的星级属于「自服务评价」，
    // 违反 Google 结构化数据政策，会连累整个站点的富媒体结果资格。
  });

  html = setJsonLd(html, 'ld-faq', buildFaqJsonLd(lang));

  // 静态正文与 noscript 提示
  html = setStaticBody(html, renderStaticBody(t));
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, `<noscript>\n        <p style="padding: 24px; font-family: sans-serif">\n            ${escapeText(cfg.noscript)}\n        </p>\n    </noscript>`);

  // 「疑似未翻译」检查：非中文页面若出现与中文逐字相同的长文案，多半是字典缺 key
  if (lang !== 'zh-CN') {
    for (const key of BODY_KEYS) {
      const value = t(key);
      if (typeof value === 'string' && value.length > 8 && value === zhT(key)) {
        console.warn(`[prerender] 警告：${lang} 的 ${key} 与中文逐字相同，疑似缺翻译`);
      }
    }
  }

  return html;
}

const template = readFileSync(templatePath, 'utf8');
const written = [];

for (const lang of Object.keys(SEO_PAGES)) {
  const cfg = SEO_PAGES[lang];
  const html = buildPage(template, lang);
  const outPath = cfg.path === '/' ? templatePath : join(distDir, cfg.path.slice(1), 'index.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  written.push([lang, outPath]);
}

// 运行时边缘改写已退役：多语言在构建期就完成了，留着 _worker.js 只会变成第二份真相
const staleWorker = join(distDir, '_worker.js');
if (existsSync(staleWorker)) {
  rmSync(staleWorker);
  console.log('[prerender] 已删除 dist/_worker.js（边缘改写已被构建期预渲染取代）');
}

if (!existsSync(join(distDir, 'og.png'))) {
  console.warn(
    '[prerender] 警告：dist/og.png 不存在，社交卡片会拿不到图（把 1200×630 的 PNG 放到 public/og.png）'
  );
}

console.log('[prerender] 已生成：');
for (const [lang, path] of written) {
  console.log(`  ${lang.padEnd(6)} → ${path.replace(projectRoot, '.')}`);
}
console.log(`[prerender] FAQ 结构化数据：${FAQ_ITEMS.length} 条 × ${written.length} 种语言`);
for (const lang of Object.keys(SEO_PAGES)) {
  const bodyText = stripHtml(renderStaticBody(tFactory(lang)));
  console.log(`[prerender] 静态正文纯文本：${lang.padEnd(6)} ${bodyText.length} 字符`);
}
