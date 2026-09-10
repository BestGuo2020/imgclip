<script setup>
// src/App.vue — 只负责挂 provider（naive-ui 需要）与页面组件。
// 页面本体在 HomePage.vue；这样拆是因为 useMessage() 必须在 NMessageProvider 的后代组件里调用。

import { NConfigProvider, NMessageProvider } from 'naive-ui';
import { themeOverrides } from './theme.js';
import HomePage from './HomePage.vue';
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <HomePage />
    </n-message-provider>
  </n-config-provider>
</template>
