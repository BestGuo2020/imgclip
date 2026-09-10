import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// 纯前端工具：解码、拆分、去底、打包全部在浏览器内完成，没有任何后端接口。
// 构建产物 dist/ 直接发布到 Cloudflare Pages：
//   public/_worker.js   → 高级模式 Worker（按 /en /ja /ko 注入各语言 SEO meta 与 JSON-LD）
//   public/_redirects   → /* → /index.html 200，保证 /zh /en /ja /ko 都能拿到同一份壳
//   public/wasm/*.wasm  → 图像处理核心，运行时 fetch 加载
// public/ 下的内容由 Vite 原样拷贝，无需构建后处理脚本。
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5175,
    host: '127.0.0.1',
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        // 组件库单独成 chunk，业务代码更新时用户仍可命中缓存
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/(naive-ui|vueuc|seemly|@css-render|lodash-es|date-fns)/.test(id)) return 'naive-ui';
          if (/cropperjs/.test(id)) return 'cropper';
          if (/jszip/.test(id)) return 'jszip';
          return 'vendor';
        },
      },
    },
  },
});
