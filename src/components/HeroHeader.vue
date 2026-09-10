<script setup>
// 页头大标题与副标题。文案来自 i18n 的 title / subtitle 两个键，
// 同时 title 也是 SEO 的页面标题（见 src/seo.js）。

import { i18n } from '../i18n.js';

const t = (key) => i18n.t(key);
</script>

<template>
  <header class="hero-header">
    <h1 class="page-title">{{ t('title') }}</h1>
    <p class="page-subtitle">{{ t('subtitle') }}</p>
  </header>
</template>

<style scoped>
.hero-header {
  text-align: center;
  margin-bottom: 30px;
  padding-top: 10px;
}

.page-subtitle {
  color: var(--text-light);
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
}
</style>
