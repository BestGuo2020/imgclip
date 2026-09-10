<script setup>
// 功能特点三卡片。对应迁移前 index.html 的 .features-grid（三张 .feature-card）。
// 文案键：f.title.1/2/3 + f.desc.1/2/3，三组均为静态内容，跟着语言切换。
// 图标沿用文案里自带的 emoji（原设计的图标就是 emoji，不是图标字体）。

import { computed } from 'vue';
import { NGrid, NGi, NCard } from 'naive-ui';
import { i18n } from '../i18n.js';

const t = (key) => i18n.t(key);

const features = computed(() => [
  { id: 1, title: t('f.title.1'), desc: t('f.desc.1') },
  { id: 2, title: t('f.title.2'), desc: t('f.desc.2') },
  { id: 3, title: t('f.title.3'), desc: t('f.desc.3') },
]);
</script>

<template>
  <section id="features" class="features-section">
    <n-grid cols="1 s:1 m:3 l:3" responsive="screen" :x-gap="25" :y-gap="25">
      <n-gi v-for="feature in features" :key="feature.id">
        <n-card class="feature-card" :bordered="true" size="small">
          <template #header>
            <span class="feature-title">{{ feature.title }}</span>
          </template>
          <p class="feature-desc">{{ feature.desc }}</p>
        </n-card>
      </n-gi>
    </n-grid>
  </section>
</template>

<style scoped>
.features-section {
  margin-bottom: 50px;
}

.feature-card {
  height: 100%;
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-main);
}

.feature-desc {
  color: var(--text-light);
  font-size: 0.95rem;
  margin: 0;
}
</style>
