<script setup>
// SEO 正文区（迁移前 .seo-content 段落）。
// 对应旧 applyI18n() 里的映射：h2←seo.title、第一个 p←seo.p1、第一个 h3←seo.h3.1、
// 第二个 p←seo.p2、第二个 h3←seo.h3.2、第三个 p←seo.p3。
// 这段是完全静态的正文，主要服务于搜索引擎收录，因此结构保持 h2/h3/p 语义层级。

import { i18n } from '../i18n.js';

const t = (key) => i18n.t(key);
</script>

<template>
  <section id="seo-content" class="seo-content">
    <h2>{{ t('seo.title') }}</h2>
    <p>{{ t('seo.p1') }}</p>

    <h3>{{ t('seo.h3.1') }}</h3>
    <p>{{ t('seo.p2') }}</p>

    <h3>{{ t('seo.h3.2') }}</h3>
    <p>{{ t('seo.p3') }}</p>
  </section>
</template>

<style scoped>
.seo-content {
  margin-bottom: 50px;
  background: #fff;
  padding: 40px;
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
}

.seo-content h2 {
  font-size: 1.5rem;
  margin: 0 0 20px;
  color: var(--text-main);
}

.seo-content h3 {
  font-size: 1.2rem;
  margin: 20px 0 10px;
  color: var(--text-main);
}

.seo-content p {
  margin: 0 0 15px;
  color: var(--text-light);
  line-height: 1.7;
  font-size: 0.95rem;
}
</style>
