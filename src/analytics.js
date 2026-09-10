// src/analytics.js — 站点埋点（Cloudflare Web Analytics）
//
// 为什么选它而不是 GA4：
//   1. 无 Cookie、不采集个人数据，与本站「图片不上传、纯本地处理」的隐私主张不冲突，
//      也不需要为它加 Cookie 同意横幅（欧洲流量不会因此掉转化）；
//   2. 免费、无需自建服务，脚本由一个 <script defer> 注入，不阻塞首屏。
//
// 怎么启用：在 Cloudflare 控制台 → Web Analytics 添加站点，拿到 token 后填到下面的
// CF_BEACON_TOKEN。留空时本模块不做任何事（不会请求任何第三方域名），
// 也就是说「没配 token」和「没有埋点」是同一种状态，不会给页面留下一个失败请求。
//
// 为什么必须补埋点：出海是「关键词 → 落地页 → 留存」的循环，没有数据就没法判断
// 哪个语言的页面有效、哪条长尾词带来了转化。

/** Cloudflare Web Analytics 的 beacon token（形如 1a2b3c...，不是 account id） */
export const CF_BEACON_TOKEN = '';

/** 注入埋点脚本。重复调用是安全的（同一个 token 只会注入一次）。 */
export function initAnalytics() {
  if (!CF_BEACON_TOKEN) return;
  if (typeof document === 'undefined') return;
  if (document.querySelector('script[data-cf-beacon]')) return;

  const el = document.createElement('script');
  el.defer = true;
  el.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  el.setAttribute('data-cf-beacon', JSON.stringify({ token: CF_BEACON_TOKEN }));
  document.head.appendChild(el);
}
