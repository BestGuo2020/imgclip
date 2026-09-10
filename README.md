# ImgCrop — 在线图片素材拆分工具

把一张包含多个元素的图片（精灵图 Sprite Sheet、贴纸拼图、电商素材拼图）自动识别并拆分成多个独立 PNG，
支持批量处理、一键去底、手动拆分、网格拆分与打包下载。

**全部计算在浏览器本地完成**（Canvas + AssemblyScript/WebAssembly），图片不上传服务器 ——
这既是隐私主张，也是零服务器成本的原因：站点是纯静态产物，没有后端。

线上：`https://imgcrop.guoguo-labs.online`（四语言：中文根路径 / `/en` / `/ja` / `/ko`）

---

## 技术栈与结构

- **前端**：Vue 3 + Vite 7 + Naive UI + cropperjs + JSZip
- **图像核心**：AssemblyScript 编译到 WebAssembly（`wasm/assembly/index.ts` → `public/wasm/imgcrop.wasm`）
- **部署**：Cloudflare Pages，纯静态，无 Functions

```
index.html                     # 页面模板：静态回退正文、SEO meta、结构化数据锚点
src/
  main.js                      # 入口：定语言 → 同步 SEO meta → 挂载 → 初始化埋点
  i18n.js                      # 四语言文案字典（文案唯一来源）+ 语言状态与取词
  seo-pages.js                 # 页面级 SEO 配置唯一来源（域名/每语言 meta/hreflang/og/FAQ 清单）
  seo.js                       # 把上面的配置写到 DOM；切语言时同步 meta 与三个 JSON-LD
  analytics.js                 # Cloudflare Web Analytics（留空 token 即不加载任何第三方）
  components/                  # HeroHeader / UploadZone / ToolActions / ResultGrid / FaqSection …
  lib/                         # pipeline / imgproc / bgremove / griddetect / detect / download
public/                        # 原样拷贝进 dist：robots.txt、sitemap.xml、_redirects、og.png、wasm/
scripts/
  verify-wasm.mjs              # WASM 核心自检
  verify-pipeline.mjs          # 图像处理管线自检
  verify-seo.mjs               # applySeoMeta 的假 DOM 断言
  verify-i18n.mjs              # 四语言字典键对齐（缺 key 会静默回退中文，这里必须硬失败）
  prerender.mjs                # 构建期生成 /en /ja /ko 的静态 HTML（见下）
  verify-prerender.mjs         # 对预渲染产物做 131 项断言
tools/
  og-card.html                 # 社交卡片图的设计源（渲染截图成 public/og.png）
```

---

## SEO 架构（改域名/加语言前必读）

### 1. 多语言是「构建期预渲染」，不是运行时改写

`scripts/prerender.mjs` 在 `vite build` 之后，用 `dist/index.html` 作模板，为每种语言输出**独立且带正文**的静态 HTML：

```
dist/index.html       中文
dist/en/index.html    英文（含英文标题、meta、canonical、JSON-LD 与英文正文）
dist/ja/index.html    日文
dist/ko/index.html    韩文
```

为什么不用客户端切换 + 边缘改写（历史上是 `public/_worker.js` 的 HTMLRewriter 方案）：不执行 JS 的爬虫
（GPTBot / PerplexityBot / ClaudeBot / CCBot 等 AI 爬虫，以及大部分社媒预览抓取）过去在 `/en` 上只能读到
**中文正文**，等于整条 AI 搜索渠道作废；而且边缘改写是运行时黑盒，本地无法断言。现在产物就在磁盘上，
`verify-prerender.mjs` 会逐条断言（canonical 是否自指、语言页里有没有混进中文、hreflang 四份是否一致、
`#app` 里静态正文是否够长……），跑不过就构建失败。

### 2. 改域名时必须一起改这四处

1. `index.html`（canonical、og:url、hreflang、JSON-LD）
2. `public/robots.txt`（Sitemap 地址）
3. `public/sitemap.xml`（四处 `<loc>` 与 `xhtml:link`）
4. `src/seo-pages.js`（`SITE_ORIGIN` 与每语言配置）

历史教训：域名从 `imgcrop.bestguo.top` 换成 `imgcrop.guoguo-labs.online` 时只改了两处，
robots.txt 与 sitemap 一直指向一个**已不存在的域名**，Search Console 拿不到 sitemap，
而 `/en` 的 canonical 又落在根路径上（英文页永远无法独立收录）。这两类问题都已修掉，
并由 `verify-prerender.mjs` 守住。

### 3. hreflang / canonical 约定

- 中文的 canonical 是**根路径**（`/`），所以 `langToPath['zh-CN'] = '/'`，切语言不会再把地址栏改写成 `/zh`；
  历史的 `/zh` 链接仍由 `_redirects` 指向中文壳。
- `x-default` 指向 `/en`：非中/日/韩用户落到英文页 —— 这正是出海要抢的那部分流量。
- 语言页的 canonical **必须自指**，否则会被当成根路径的重复内容。

### 4. `_redirects` 里为什么没有 `/*  /index.html  200`

Cloudflare Pages 在没有顶层 `404.html` 时自带 SPA 回退（深链自动回落到根页），所以那条 catch-all 是多余的；
更重要的是它是风险的：Redirects 文档写着「Redirects are always followed, regardless of whether or not an
asset matches the incoming request」，一旦它生效就可能把 `/assets/*.js`、`/robots.txt`、`/og.png`
改写成 index.html。因此 `_redirects` 只显式列语言路径（与 sitemap、hreflang 对齐），不带 catch-all。

### 5. 社交卡片图（og:image）

`public/og.png`（1280×720）由 `tools/og-card.html` 渲染截图生成 —— 尺寸取 1280×720 是因为无头浏览器视口
固定为该尺寸，而仓库不引入 sharp/canvas 这类裁剪依赖；16:9 在按 1.91:1 展示时上下各裁约 25px，正文距边缘
84px，裁不到内容。**声明值与文件真实尺寸必须一致**，否则平台不渲染。

重新生成：`node ../tools/og-card-server.mjs 8791`，浏览器打开
`http://127.0.0.1:8791/imgcrop/tools/og-card.html` 截图，覆盖 `public/og.png`（记得清掉文件只读属性）。

历史问题：og:image 曾经是 `data:image/svg+xml,...` —— X / Facebook / Slack / Discord 与各家 AI 抓取
一律不认 data: URI，分享出去没有卡片。

---

## 本地开发与构建

```bash
pnpm install
pnpm dev          # http://localhost:5173（/en /ja /ko 由前端按路径前缀切换语言）
pnpm build        # 校验 i18n → vite build → 预渲染四语言 → 131 项产物断言
pnpm preview      # 预览生产构建
pnpm selftest     # WASM + 图像管线 + applySeoMeta 三套自检
pnpm verify:i18n  # 单独跑四语言字典键对齐检查
pnpm prerender    # 只重跑预渲染与产物断言（需要先有 dist/）
pnpm build:wasm   # 重新编译 WASM（改动 wasm/assembly/index.ts 后执行）
```

`pnpm build` 会在预渲染或断言失败时**直接失败**（exit 1），不会把坏产物发上线。

## 部署（Cloudflare Pages）

- Build command：`pnpm build`
- Build output directory：`dist`
- 不需要任何 Functions / Worker（`public/_worker.js` 已退役并删除）
- 自定义域名：`imgcrop.guoguo-labs.online`

部署后要做（一次性）：

1. **Google Search Console**：用 DNS 或 HTML 标记验证（`index.html` 里留了注释掉的验证 meta 占位）。
   提交 sitemap：`https://imgcrop.guoguo-labs.online/sitemap.xml`。
2. **Bing Webmaster**：`public/BingSiteAuth.xml` 已存在。
3. **埋点**：在 Cloudflare 控制台 → Web Analytics 添加站点，把 token 填进 `src/analytics.js` 的
   `CF_BEACON_TOKEN`。留空时不会加载任何第三方脚本。选它而不是 GA4 的原因：无 Cookie、不采集个人数据，
   与「图片不上传」的隐私主张不冲突，也不需要 Cookie 同意横幅。
4. 用 Rich Results Test / Facebook 分享调试器验证结构化数据与卡片图。

### 部署后必须验证（本地无法验证，但它决定预渲染是否真的生效）

```powershell
# 1) 确认 Pages 返回的是该语言的预渲染文件，而不是中文壳
curl.exe -s https://imgcrop.guoguo-labs.online/en | Select-String '<html lang=','<h1'
#    必须看到 lang="en" 且 h1 是英文。只验证 <title> 不够 —— 旧方案（边缘改写 meta）
#    正是只改了 head，正文一直是中文，爬虫看到的也就一直是中文。
# 2) canonical 必须自指，否则该语言页永远无法独立收录
curl.exe -s https://imgcrop.guoguo-labs.online/en | Select-String 'rel="canonical"'
# 3) robots / sitemap 必须指向当前域名（历史上它们指向了一个已不存在的域名）
curl.exe -s https://imgcrop.guoguo-labs.online/robots.txt
curl.exe -s https://imgcrop.guoguo-labs.online/sitemap.xml | Select-String '<loc>'
# 4) 用 AI 爬虫的 UA 抓一次：它们不执行 JS，只能读静态 HTML
curl.exe -s -A "Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)" https://imgcrop.guoguo-labs.online/en | Select-String '<h1'
```

若第 1 条返回的仍是中文壳，说明 Pages 没命中 `dist/en/index.html`：检查 `public/_redirects` 里的六条语言规则是否存在、且排在最后一条之前（`verify-prerender.mjs` 会断言这两点）。
另：**不要**在 Cloudflare 后台开启托管的 robots.txt / AI 爬虫管控 —— 它默认会 Disallow GPTBot / ClaudeBot / CCBot 等，等于把 AI 搜索引用这条渠道关掉（头号竞品 frameextractor.net 就关着）。

## 已知问题与待办

- **广告与隐私主张冲突（仍未解决）**：`src/HomePage.vue` 里通过 `AdSlot.vue` 挂了两个第三方广告脚本
  （`effectivecpmnetwork` / `highperformanceformat` 的 `invoke.js`，Adsterra 系），而页面主张是
  「图片不上传、隐私级安全」。这类网络的素材质量不可控（假下载按钮之类），放在一个让用户下载文件的工具站上
  既不诚信也有安全/账号风险。只有两个干净的选择：撤掉这两个脚本，或者按 `video-frame-extractor` 的做法
  把隐私文案改成「永远可验证为真」的版本（页脚只留本地处理与不上传，数据边界写进 FAQ）。
- **`ads.txt` 已删除**：它此前声明了 Google 的卖方 ID（`google.com, pub-857642…`），但本站从未接入 AdSense。
  ads.txt 是「授权卖方」声明，写着并不存在的关系只会误导买方与审核方；Adsterra 系并不要求 ads.txt。
  将来真的接入 AdSense / AdX 时再加回来。删除后 `/ads.txt` 会走 Pages 的 SPA 回退返回 HTML ——
  对读取方而言无效格式等同于「无授权卖方」，没有副作用。
- **英文浏览器访问根路径会被前端改写到 `/en`**：`main.js` 在根路径会按 `navigator.language` 归一化语言，
  英文环境的 Googlebot 渲染时可能跟着跳到 `/en`，与「根路径 = 中文 canonical」略有张力。观察 Search Console
  的收录情况，若根路径收录异常，就改成只在用户手动切换时才改地址。
- **`aggregateRating` 已移除**：曾经写死 4.9 分 / 128 条评价 —— 自服务评价违反 Google 结构化数据政策，
  会连累富媒体结果资格，不要再加回来。
- **ja / ko 文案**可由母语者复核一遍：目前四种语言键完全对齐，但营销措辞是机器辅助翻译。
