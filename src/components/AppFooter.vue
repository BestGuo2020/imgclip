<script setup>
// 页脚版权。文案来自 i18n 的 copyright 键。
// 注意：迁移前版权年份在 HTML 里硬编码为 2026，i18n 的 copyright 键里也含年份，
// 这里沿用语言文案（与旧 applyI18n 的行为一致：切语言时整个字符串被替换）。

import { i18n } from '../i18n.js';

const t = (key) => i18n.t(key);
</script>

<template>
  <footer>
    <p class="copyright">{{ t('copyright') }}</p>
  </footer>
</template>

<style scoped>
footer {
  text-align: center;
  padding: 40px;
  color: var(--text-light);
  font-size: 0.9rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.copyright {
  margin: 0;
}
</style>
