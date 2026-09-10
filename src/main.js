import { createApp } from 'vue';
import App from './App.vue';
import { i18n, setLang, langFromPath, HTML_LANG } from './i18n.js';
import { applySeoMeta } from './seo.js';
import { initAnalytics } from './analytics.js';
import './style.css';

// 路径前缀（/en /ja /ko）优先于 localStorage 与浏览器语言，
// 与迁移前 initI18n() 的优先级一致：先看 URL，再看本地存储。
const fromPath = langFromPath(window.location.pathname);
if (fromPath) {
  i18n.lang = fromPath;
} else {
  // 中文站点发布在根路径，地址栏不属于 /zh /en /ja /ko 时归一化到当前语言的路径，
  // 保证 hreflang 指向的四个 URL 都真实可访问（_redirects 会把它们都回落到同一份壳）。
  setLang(i18n.lang);
}
document.documentElement.lang = HTML_LANG[i18n.lang];

// 首屏同步一次 SEO meta：_worker.js 只在 /en /ja /ko 上做了服务端注入，
// 中文根路径、以及任何客户端切换语言后的 meta 都由这里负责。
applySeoMeta(i18n.lang);

createApp(App).mount('#app');

// 埋点放在挂载之后：它对首屏没有任何影响，而只有挂载成功才算一次真实访问。
// 没配 token 时 initAnalytics() 直接返回，不会产生任何第三方请求（见 src/analytics.js）。
initAnalytics();
