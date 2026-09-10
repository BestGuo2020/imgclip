<script setup>
// 裁剪舞台：承载 cropper.js 实例的预览区。
//
// 迁移前这段逻辑散在 handleFile() 里（先 img.src = dataURL，再 new Cropper(img, opts)），
// 这里收敛成一个组件：src 变化时销毁旧实例、重建新实例。
// cropper 的配置与迁移前逐字一致：viewMode 1 / autoCropArea 1 / responsive true / background false。
//
// 通过 defineExpose 暴露 getCroppedCanvas()，父组件在每次拆分动作前取当前选区画布。

import { onBeforeUnmount, ref, watch } from 'vue';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

const props = defineProps({
  /** 图片 dataURL；为空表示尚未选择图片 */
  src: { type: String, default: '' },
});

const imgEl = ref(null);
let cropper = null;

function destroy() {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

function create() {
  if (!imgEl.value || !props.src) return;
  destroy();
  cropper = new Cropper(imgEl.value, {
    viewMode: 1,
    autoCropArea: 1,
    responsive: true,
    background: false, // 不显示网格背景
  });
}

watch(
  () => props.src,
  (value) => {
    if (value) {
      // 等 <img> 拿到新 src 之后再建实例
      requestAnimationFrame(create);
    } else {
      destroy();
    }
  }
);

onBeforeUnmount(destroy);

/**
 * 取当前裁剪选区画布；没有实例或选区不可用时返回 null。
 * 调用方需自行判空（旧实现里是 throw new Error('画布不可用')）。
 */
function getCroppedCanvas() {
  if (!cropper) return null;
  try {
    return cropper.getCroppedCanvas();
  } catch {
    return null;
  }
}

defineExpose({ getCroppedCanvas });
</script>

<template>
  <div v-show="src" class="crop-stage">
    <img ref="imgEl" :src="src" alt="待拆分的图片" />
  </div>
</template>
