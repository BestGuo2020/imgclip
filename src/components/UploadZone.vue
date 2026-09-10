<script setup>
// 上传区：拖拽或点击选择图片。
// 迁移前是「原生 div + 隐藏的 <input type="file" multiple>」，这里换成 naive-ui 的
// NUpload + NUploadDragger，拖拽能力由组件提供。
//
// compact 属性：迁移前 handleFile() 在上传成功后会把这些文字元素
//（.upload-icon / .upload-hint / .upload-sub / .privacy-badge）用 display:none 隐藏，
// 但**虚线框本身仍保留并可点击**，用来换图。为了不改变这个行为，
// compact=true 时只隐藏文字、保留可点击/可拖拽的投放区。
//
// 说明：旧 input 虽然带 multiple，但 handleFile(file) 每次只处理一个文件，
// 因此这里同样只取第一个文件，保持行为不变。

import { ref } from 'vue';
import { NUpload, NUploadDragger } from 'naive-ui';
import { i18n } from '../i18n.js';

defineProps({
  /** 已选图后进入紧凑模式：隐藏文字提示，只留投放区 */
  compact: { type: Boolean, default: false },
});

const emit = defineEmits(['select']);

// 绑定 file-list 是为了在选中后清空，否则再次选择同一张图片不会触发 change
const fileList = ref([]);

const t = (key) => i18n.t(key);

function onChange({ file }) {
  if (file && file.file) emit('select', file.file);
  // 清空，保证同一文件再次选择仍触发 change（等价于旧代码 fileInput.value = ''）
  fileList.value = [];
}
</script>

<template>
  <n-upload
    v-model:file-list="fileList"
    :show-file-list="false"
    :default-upload="false"
    accept="image/*"
    class="upload-area"
    @change="onChange"
  >
    <n-upload-dragger class="upload-dragger" :class="{ compact }">
      <template v-if="!compact">
        <span class="upload-icon">☁️</span>
        <div class="upload-hint">{{ t('upload.text') }}</div>
        <div class="upload-sub">{{ t('upload.sub') }}</div>
        <div class="privacy-badge">{{ t('privacy.badge') }}</div>
      </template>
    </n-upload-dragger>
  </n-upload>
</template>

<style scoped>
.upload-area {
  width: 100%;
}

.upload-dragger {
  padding: 50px 20px !important;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.upload-dragger:hover {
  transform: translateY(-2px);
}

/* 紧凑模式：投放区保留但不需要撑得很高 */
.upload-dragger.compact {
  padding: 14px 20px !important;
  min-height: 0;
}

.upload-icon {
  font-size: 56px;
  display: block;
  margin-bottom: 15px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.upload-hint {
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--text-main);
  margin-bottom: 8px;
}

.upload-sub {
  color: #999;
  font-size: 0.9rem;
}

.privacy-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 15px;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>
