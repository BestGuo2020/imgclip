<script setup>
// 拆分结果网格。迁移前是 displayResults() 里用 innerHTML 拼 .result-item 字符串，
// 每张卡片带「下载 / 删除」两个 inline onclick 按钮。这里换成 NCard + NImage + NButton，
// 由 Vue 数据驱动渲染，不再拼 HTML 字符串。

import { NGrid, NGi, NCard, NImage, NButton, NSpace, NEmpty } from 'naive-ui';
import { i18n } from '../i18n.js';

defineProps({
  /** [{ id, dataURL, width, height }] */
  images: { type: Array, default: () => [] },
});

const emit = defineEmits(['download', 'delete']);

const t = (key) => i18n.t(key);
</script>

<template>
  <div class="results-section">
    <h2 class="results-title">{{ t('results.title') }}</h2>

    <n-empty v-if="images.length === 0" :description="t('results.title')" class="results-empty" />

    <n-grid v-else cols="2 s:3 m:4 l:5" responsive="screen" :x-gap="15" :y-gap="15">
      <n-gi v-for="(image, index) in images" :key="image.id">
        <n-card class="result-item" size="small" :bordered="true">
          <!-- 透明背景用棋盘格衬底，方便看清抠图边缘 -->
          <n-image
            :src="image.dataURL"
            :alt="`Result ${index + 1}`"
            object-fit="contain"
            class="result-image"
            :preview-disabled="false"
          />
          <div class="result-size">
            {{ t('result.size') }} {{ Math.round(image.width) }}x{{ Math.round(image.height) }}
          </div>
          <n-space :size="5" justify="center" class="result-actions">
            <n-button type="primary" size="tiny" @click="emit('download', index)">
              {{ t('btn.download') }}
            </n-button>
            <n-button size="tiny" secondary @click="emit('delete', index)">
              {{ t('btn.delete') }}
            </n-button>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<style scoped>
.results-section {
  margin-top: 30px;
  border-top: 1px solid #f3f4f6;
  padding-top: 20px;
}

.results-title {
  margin: 0 0 15px;
  font-size: 1.2rem;
}

.results-empty {
  padding: 20px 0;
}

.result-item {
  height: 100%;
  transition: transform 0.2s;
}

.result-item:hover {
  transform: translateY(-3px);
}

.result-image {
  width: 100%;
  height: 160px;
  background-image: linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee),
    linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  border-radius: 8px;
}

.result-image :deep(img) {
  height: 160px;
  object-fit: contain;
}

.result-size {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-light);
  margin: 8px 0;
}

.result-actions {
  width: 100%;
}
</style>
