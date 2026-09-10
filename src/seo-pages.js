// src/seo-pages.js — 页面级 SEO 配置的唯一来源
//
// 为什么要有这个文件：同一份「每个语言的 title/description/keywords/og 文案」原本散在
// 三个地方 —— public/_worker.js 的语言包、src/seo.js 里的 META_DESCRIPTIONS / OG_DESCRIPTIONS /
// META_KEYWORDS、以及 index.html 的静态 meta。三份副本已经漂移过一次（域名从
// imgcrop.bestguo.top 换成 imgcrop.guoguo-labs.online 时只改了两处），所以这里收敛成一份。
//
// 消费方：
//   1. src/seo.js —— 浏览器端切语言时同步 meta 与 JSON-LD；
//   2. scripts/prerender.mjs —— 构建期为每个语言生成独立的静态 HTML（页面标题、canonical、
//      正文都在构建期写死，不依赖运行时边缘改写，见该脚本顶部说明）。
//
// 改域名时必须一起改四处：index.html、public/robots.txt、public/sitemap.xml、本文件。

/** 站点主域名。canonical / og:url / sitemap / JSON-LD 全部基于它拼接。 */
export const SITE_ORIGIN = 'https://imgcrop.guoguo-labs.online';

/** 站点名（导航栏与 JSON-LD 用，四种语言一致，不随语言翻译） */
export const SITE_NAME = 'ImgCrop';

/** og:locale 的写法与 <html lang> 不同（下划线、地区大写） */
export const OG_LOCALE = {
  'zh-CN': 'zh_CN',
  en: 'en_US',
  ja: 'ja_JP',
  ko: 'ko_KR',
};

/**
 * 每个语言的页面级 SEO 配置。
 * path 必须与 public/sitemap.xml 的 <loc> 和 index.html 的 hreflang 完全一致：
 * 中文的 canonical 是根路径（'/'），英文是 x-default。
 *
 * noscript 是「禁用 JS 时看到的提示」，它不进 i18n 字典是因为它只在静态 HTML 里出现，
 * 组件渲染的页面永远看不到它。
 */
export const SEO_PAGES = {
  'zh-CN': {
    path: '/',
    htmlLang: 'zh-CN',
    description:
      '免费在线图片素材拆分工具，自动识别一张图片中的多个独立元素并裁剪为单独的PNG文件。适合游戏Sprite精灵图拆分、贴纸素材提取、电商拼图切片。',
    keywords:
      '图片素材拆分,图片分割工具,Sprite切片,精灵图拆分,在线切图,图片素材提取,批量裁剪,PNG分割',
    ogTitle: '智能图片素材拆分工具 - 一键提取多个素材',
    ogDescription: '自动识别并拆分一张图片中的多个独立素材，一键导出为单独的PNG文件。纯本地处理，保护隐私。',
    noscript:
      '本工具需要 JavaScript 才能在浏览器内完成图片拆分与去底（WebAssembly + Canvas），请启用 JavaScript 后重新打开页面。',
  },
  en: {
    path: '/en',
    htmlLang: 'en',
    description:
      'Free online tool to auto-split sprite sheets and scanned photos into separate PNG images. One-click batch extraction. Local processing, privacy safe.',
    keywords:
      'image splitter, sprite sheet cutter, auto crop multiple photos, extract images from image, sprite slicer, online image separator',
    ogTitle: 'Smart Image Splitter - Extract Multiple Images in One Click',
    ogDescription:
      'Automatically detect and split multiple objects from a single image. Export as separate PNGs. 100% local processing.',
    noscript:
      'This tool needs JavaScript to split images and remove backgrounds in your browser (WebAssembly + Canvas). Please enable JavaScript and reload the page.',
  },
  ja: {
    path: '/ja',
    htmlLang: 'ja',
    description:
      'スプライトシートやスキャンした写真を自動的に個別のPNG画像に分割・切り抜きできる無料オンラインツール。ブラウザ完結でプライバシーも安心。',
    keywords: '画像分割, スプライトシート分割, 画像切り抜き, 自動切り抜き, 一括保存, 素材抽出, オンラインツール',
    ogTitle: '画像自動分割ツール - 複数の素材を一括切り抜き',
    ogDescription:
      '一枚の画像に含まれる複数の要素を自動認識して分割し、個別のPNGとして保存します。インストール不要、完全無料。',
    noscript:
      'このツールはブラウザ内で画像を分割・背景除去するために JavaScript（WebAssembly + Canvas）が必要です。JavaScript を有効にして再読み込みしてください。',
  },
  ko: {
    path: '/ko',
    htmlLang: 'ko',
    description:
      '스프라이트 시트나 스캔한 사진에서 여러 이미지를 자동으로 감지하여 개별 PNG로 분할해 주는 무료 온라인 도구입니다. 100% 로컬 처리로 안전합니다.',
    keywords: '이미지 분할, 스프라이트 자르기, 사진 자동 자르기, 이미지 추출, 누끼따기, 온라인 이미지 편집',
    ogTitle: '스마트 이미지 분할 도구 - 한 번의 클릭으로 이미지 추출',
    ogDescription:
      '하나의 이미지에 포함된 여러 요소를 자동으로 인식하여 분할하고 저장합니다. 서버 업로드 없이 브라우저에서 바로 처리하세요.',
    noscript:
      '이 도구는 브라우저에서 이미지를 분할하고 배경을 제거하기 위해 JavaScript(WebAssembly + Canvas)가 필요합니다. JavaScript를 활성화한 뒤 새로고침해 주세요.',
  },
};

/** 取某语言的绝对 URL（canonical / og:url / JSON-LD 共用） */
export function pageUrl(lang) {
  return SITE_ORIGIN + (SEO_PAGES[lang]?.path ?? '/');
}

/**
 * 全站统一的 hreflang 集群。
 * 两个硬约束：① 每条都必须指向「canonical 形式」的 URL；② 必须与 public/sitemap.xml 一致。
 * x-default 指向英文站 —— 非中/日/韩用户落到英文页，这正是出海要抢的那部分流量。
 */
export const HREFLANG_LINKS = [
  { hreflang: 'zh-CN', lang: 'zh-CN' },
  { hreflang: 'en', lang: 'en' },
  { hreflang: 'ja', lang: 'ja' },
  { hreflang: 'ko', lang: 'ko' },
  { hreflang: 'x-default', lang: 'en' },
];

/**
 * og:image（PNG，构建产物里的真实文件；不能用 data: URI —— 社交爬虫不认）。
 * 尺寸是 1280×720 而不是常见的 1200×630：卡片图由浏览器截图生成，视口固定 1280×720，
 * 而仓库不允许为「裁图」引入 sharp/canvas 之类的依赖。宽 ≥1200 且 16:9 在按 1.91:1
 * 展示时上下各裁 ~25px，对布局无影响。声明值必须与文件真实尺寸一致，否则平台会不渲染。
 */
export const OG_IMAGE = {
  url: SITE_ORIGIN + '/og.png',
  width: 1280,
  height: 720,
};

/**
 * FAQ 条目（问题 key / 答案 key）。
 * 三个消费方共用这一份清单：静态回退正文、JSON-LD 的 FAQPage、以及常见问题组件
 * （FaqSection.vue 里的 7 是同一个事实，改条目数时三处都要动）。
 * 答案在字典里含 <br>，因此按 HTML 片段渲染；写进 JSON-LD 时必须先剥标签。
 */
export const FAQ_ITEMS = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
  q: `faq.q${n}`,
  a: `faq.a${n}`,
}));

/** 把含 <br> 之类的文案变成纯文本（JSON-LD 的 text 字段不允许 HTML） */
export function stripHtml(text) {
  return String(text ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
