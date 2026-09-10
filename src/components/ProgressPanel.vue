<script setup>
// 进度条：迁移前是手写的 .progress-bar-container + .progress-bar（靠改 style.width 驱动），
// 这里换成 naive-ui 的 NProgress。
// 进度文案由 src/lib/pipeline.js 上报（与迁移前一致，进度提示保持中文原文，未做多语言）。

import { NProgress } from 'naive-ui';

defineProps({
  /** 0-100 */
  percent: { type: Number, default: 0 },
  text: { type: String, default: '' },
});
</script>

<template>
  <div class="progress-panel">
    <div class="progress-info">
      <span>{{ text }}</span>
      <span>{{ Math.round(percent) }}%</span>
    </div>
    <n-progress
      type="line"
      :percentage="Math.min(100, Math.max(0, percent))"
      :show-indicator="false"
      :height="12"
    />
  </div>
</template>

<style scoped>
.progress-panel {
  margin-top: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: var(--text-light);
  font-weight: 500;
}
</style>
