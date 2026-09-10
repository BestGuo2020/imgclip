<script setup>
// 顶部导航栏：Logo + 锚点导航 + 语言切换
// 语言下拉由原生 <select> 换成 naive-ui 的 NSelect（迁移前用 onchange="changeLanguage()"）。

import { computed } from 'vue';
import { NSelect } from 'naive-ui';
import { i18n, LANGS } from '../i18n.js';

const emit = defineEmits(['change-lang']);

// 语言代码 → 下拉里显示的名称（迁移前 <option> 的文案，未改动）
const LANG_LABELS = {
  'zh-CN': '简体中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};

const options = LANGS.map((lang) => ({ label: LANG_LABELS[lang], value: lang }));

const current = computed({
  get: () => i18n.lang,
  set: (value) => emit('change-lang', value),
});

const t = (key) => i18n.t(key);
</script>

<template>
  <nav class="navbar">
    <div class="navbar-container">
      <a href="#" class="logo"><span>✂️</span> ImgCrop</a>

      <div class="nav-right">
        <ul class="nav-links">
          <li><a href="#" class="nav-home">{{ t('nav.home') }}</a></li>
          <li><a href="#features" class="nav-features">{{ t('nav.features') }}</a></li>
          <li><a href="#seo-content" class="nav-scene">{{ t('nav.scene') }}</a></li>
          <li><a href="#faq" class="nav-faq">{{ t('nav.faq') }}</a></li>
        </ul>
        <n-select
          v-model:value="current"
          :options="options"
          size="small"
          class="lang-select"
          :consistent-menu-width="false"
        />
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.8rem 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-links {
  display: flex;
  gap: 20px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links a {
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.3s;
  color: var(--text-main);
}

.nav-links a:hover {
  color: var(--primary);
}

.lang-select {
  width: 120px;
}

@media (max-width: 768px) {
  .navbar-container {
    flex-direction: column;
    gap: 15px;
  }

  .nav-links {
    display: none;
  }
}
</style>
