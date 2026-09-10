<script setup>
// 操作按钮组。
//
// 迁移前是一个手写的 hover 下拉（.dropdown.show 切 class），这里换成 naive-ui 的 NDropdown：
//   - 「⚡ 智能拆分」按钮本身点击 = 智能拆分
//   - 悬停该按钮展开菜单 = [一键去底] / [先去底再拆分]
// 其余按钮（手动拆分 / 网格拆分 / 打包下载 / 重置）都是一对一的 NButton。
//
// 按钮文案自带的 emoji 来自 i18n（如 'btn.smartCrop': '⚡ 智能拆分'），与旧视觉一致。

import { computed } from 'vue';
import { NButton, NDropdown, NSpace } from 'naive-ui';
import { i18n } from '../i18n.js';

const props = defineProps({
  /** 是否已选择图片（决定拆分类按钮可用） */
  hasImage: { type: Boolean, default: false },
  /** 是否已有拆分结果（决定打包下载可用） */
  hasResults: { type: Boolean, default: false },
  /** 处理中：全部禁用，等价于迁移前的 toggleButtons(true) */
  busy: { type: Boolean, default: false },
});

const emit = defineEmits([
  'smart-crop',
  'manual-crop',
  'grid-split',
  'download-all',
  'reset',
  'bg-remove',
  'bg-remove-then-crop',
]);

const t = (key) => i18n.t(key);

const canCrop = computed(() => props.hasImage && !props.busy);
const canDownload = computed(() => props.hasResults && !props.busy);
const canReset = computed(() => props.hasImage && !props.busy);

const menuOptions = computed(() => [
  { label: t('btn.bgRemove'), key: 'bg-remove' },
  { label: t('btn.bgRemoveThenCrop'), key: 'bg-remove-then-crop' },
]);

function onSelect(key) {
  if (props.busy) return;
  if (key === 'bg-remove') emit('bg-remove');
  else if (key === 'bg-remove-then-crop') emit('bg-remove-then-crop');
}
</script>

<template>
  <div class="controls-section">
    <n-space justify="center" :size="12" align="center" :wrap="true">
      <!-- 智能拆分 + 悬停菜单 -->
      <n-dropdown
        trigger="hover"
        :options="menuOptions"
        :disabled="!canCrop"
        placement="bottom-start"
        @select="onSelect"
      >
        <n-button type="primary" :disabled="!canCrop" @click="emit('smart-crop')">
          {{ t('btn.smartCrop') }}
        </n-button>
      </n-dropdown>

      <n-button secondary :disabled="!canCrop" @click="emit('manual-crop')">
        {{ t('btn.manualCrop') }}
      </n-button>

      <n-button secondary :disabled="!canCrop" @click="emit('grid-split')">
        {{ t('btn.gridSplit') }}
      </n-button>

      <n-button secondary :disabled="!canDownload" @click="emit('download-all')">
        {{ t('btn.downloadAll') }}
      </n-button>

      <n-button secondary :disabled="!canReset" @click="emit('reset')">
        {{ t('btn.reset') }}
      </n-button>
    </n-space>
  </div>
</template>

<style scoped>
.controls-section {
  margin-top: 30px;
}
</style>
