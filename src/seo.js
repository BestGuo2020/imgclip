// src/seo.js — SEO meta 与结构化数据（JSON-LD）的客户端同步
//
// 职责边界（改这个文件前先看这段）：
//   1. 页面级配置的唯一来源是 src/seo-pages.js，本文件只负责「把它写到当前 DOM 上」；
//   2. 构建期 scripts/prerender.mjs 已经为每个语言输出了带正确 title/meta/JSON-LD 的静态
//      HTML（/en /ja /ko 各一份，中文是根路径）。本文件覆盖的是静态 HTML 管不到的情况：
//      用户在页面上切语言后，地址栏、页面语言、meta 语言必须立刻一致（否则 hreflang
//      声明的是一个语言、页面渲染的是另一个语言，搜索引擎会把这类页面判成低质量）；
//   3. 静态 HTML、本文件、以及已退役的 _worker.js 三者必须给出同样的结果 —— 这正是把配置
//      收敛到 seo-pages.js、并把多语言从运行时边缘改写改成构建期预渲染的原因。

import { i18n } from './i18n.js';
import { SEO_PAGES, FAQ_ITEMS, stripHtml } from './seo-pages.js';

/**
 * meta[name="description"] 各语言取值。
 * 保留这三个导出的名字是为了兼容 scripts/verify-seo.mjs（它按语言断言这三个值），
 * 数据本身来自 seo-pages.js，不再在这里重复维护。
 */
export const META_DESCRIPTIONS = Object.fromEntries(
  Object.entries(SEO_PAGES).map(([lang, cfg]) => [lang, cfg.description])
);

/** og:description 与 twitter:description 各语言取值 */
export const OG_DESCRIPTIONS = Object.fromEntries(
  Object.entries(SEO_PAGES).map(([lang, cfg]) => [lang, cfg.ogDescription])
);

/** meta[name="keywords"] 各语言取值 */
export const META_KEYWORDS = Object.fromEntries(
  Object.entries(SEO_PAGES).map(([lang, cfg]) => [lang, cfg.keywords])
);

function setMeta(selector, content) {
  if (!content) return;
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', content);
}

function updateJsonLd(id, mutate) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    const data = JSON.parse(el.textContent);
    mutate(data);
    el.textContent = JSON.stringify(data, null, 4);
  } catch (error) {
    console.error(`[seo] 更新 ${id} 结构化数据失败`, error);
  }
}

/**
 * 生成指定语言的 FAQPage 结构化数据。
 * 构建期（scripts/prerender.mjs）写静态 HTML 和运行期切语言都用这一份，
 * 保证「页面上的问答」和「结构化数据里的问答」永远同源。
 */
export function buildFaqJsonLd(lang) {
  const previous = i18n.lang;
  i18n.lang = lang;
  try {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
        '@type': 'Question',
        name: i18n.t(q),
        acceptedAnswer: { '@type': 'Answer', text: stripHtml(i18n.t(a)) },
      })),
    };
  } finally {
    i18n.lang = previous;
  }
}

/**
 * 把页面级 SEO 信息同步到指定语言。
 * 与迁移前 applyI18n() 的 SEO 部分逐项对应：
 * title / og:title / twitter:title / description / keywords / og:description / twitter:description
 * 以及 WebSite、Tool、FAQPage 三个 JSON-LD。
 */
export function applySeoMeta(lang) {
  const previous = i18n.lang;
  // t() 依赖 i18n.lang，这里临时切到目标语言取值，结束后还原，避免改到响应式状态
  i18n.lang = lang;
  try {
    const title = i18n.t('title');
    document.title = title;
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[name="twitter:title"]', title);

    setMeta('meta[name="description"]', META_DESCRIPTIONS[lang]);
    setMeta('meta[name="keywords"]', META_KEYWORDS[lang]);
    setMeta('meta[property="og:description"]', OG_DESCRIPTIONS[lang]);
    setMeta('meta[name="twitter:description"]', OG_DESCRIPTIONS[lang]);

    const siteName = i18n.t('schema.websiteName');

    updateJsonLd('ld-website', (data) => {
      data.name = siteName;
      data.description = i18n.t('schema.websiteDesc');
    });

    updateJsonLd('ld-tool', (data) => {
      data.name = siteName;
      data.description = i18n.t('schema.toolDesc');
      data.featureList = i18n.list('schema.featureList');
    });

    // FAQ 结构化数据同样要跟着语言走：切到英文后如果 DOM 里还是中文 FAQPage，
    // 结构化数据与页面内容不一致，属于富媒体结果会被判违规的那类问题。
    const faq = buildFaqJsonLd(lang);
    updateJsonLd('ld-faq', (data) => {
      data['@context'] = faq['@context'];
      data['@type'] = faq['@type'];
      data.mainEntity = faq.mainEntity;
    });
  } finally {
    i18n.lang = previous;
  }
}
