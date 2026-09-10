<script setup>
// src/HomePage.vue — 页面主体与交互编排
//
// 迁移前的交互逻辑散在 script.js 的 DOMContentLoaded 里（96 处 getElementById / querySelector
// 手工改 DOM），这里改成 Vue 的响应式状态 + 事件驱动：
//   状态：imageSrc（当前图片）、results（拆分结果）、progress、busy
//   动作：智能拆分 / 手动拆分 / 网格拆分 / 一键去底 / 先去底再拆分 / 打包下载 / 重置
// 算法与流程实现全部在 src/lib/ 下，本文件只负责把状态与它们接起来。

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { NSpace, NSpin, useMessage } from 'naive-ui';

import NavBar from './components/NavBar.vue';
import HeroHeader from './components/HeroHeader.vue';
import UploadZone from './components/UploadZone.vue';
import CropStage from './components/CropStage.vue';
import ToolActions from './components/ToolActions.vue';
import ProgressPanel from './components/ProgressPanel.vue';
import ResultGrid from './components/ResultGrid.vue';
import FeatureGrid from './components/FeatureGrid.vue';
import SeoContent from './components/SeoContent.vue';
import FaqSection from './components/FaqSection.vue';
import AppFooter from './components/AppFooter.vue';
import AdSlot from './components/AdSlot.vue';

import { i18n, setLang } from './i18n.js';
import { applySeoMeta } from './seo.js';
import { initImgProc, usingWasm } from './lib/imgproc.js';
import {
  runSmartCrop,
  runBgRemoveThenCrop,
  runGridSplit,
  runBackgroundRemove,
  manualCropOne,
} from './lib/pipeline.js';
import { downloadImage, downloadAllAsZip } from './lib/download.js';

const message = useMessage();

const t = (key) => i18n.t(key);

/** 旧代码里「画布不可用」这句错误文案，保持原样 */
const CANVAS_UNAVAILABLE = '画布不可用';

// ---------- 广告位配置（与迁移前 index.html 中的两处一致，参数未改动）----------
const AD_IN_TOOL = {
  containerId: 'container-523f197c5f53697564ba236d80e6d1e4',
  scriptSrc: 'https://pl30589912.effectivecpmnetwork.com/523f197c5f53697564ba236d80e6d1e4/invoke.js',
  cfAsyncFalse: true,
  async: true,
  minHeight: '0px',
};

const AD_MIDDLE = {
  atOptions: {
    key: '3c3c6ac5cb8ae25bdfc8f03d0415c9b2',
    format: 'iframe',
    height: 90,
    width: 728,
    params: {},
  },
  scriptSrc: 'https://www.highperformanceformat.com/3c3c6ac5cb8ae25bdfc8f03d0415c9b2/invoke.js',
  async: false,
  minHeight: '90px',
};

// ---------- 状态 ----------
const stage = ref(null);
const imageSrc = ref('');
const results = ref([]);
const busy = ref(false);
const progress = reactive({ visible: false, percent: 0, text: '' });

// 结果项的 key：旧代码用数组下标当 id，删除后会撞 key，这里换成单调递增，文件名仍按数组下标生成
let nextId = 0;
const assignIds = (items) => items.map((item) => ({ ...item, id: nextId++ }));

const hasImage = computed(() => !!imageSrc.value);
const hasResults = computed(() => results.value.length > 0);

// ---------- 进度上报（pipeline 的回调）----------
function report(percent, text) {
  progress.visible = true;
  progress.percent = Math.max(0, Math.min(100, percent));
  progress.text = text || '';
}

function hideProgressSoon() {
  // 旧实现在完成后延迟 300ms 隐藏，让用户看到 100%
  setTimeout(() => {
    progress.visible = false;
  }, 300);
}

function fail(error, label) {
  console.error(`[ImgCrop] ${label} 失败：`, error);
  progress.visible = false;
  message.error(error && error.message ? String(error.message) : String(error));
}

/**
 * 跑一段同步的重活。旧实现都包在 setTimeout(…, 50) 里，
 * 目的是先让 loading 与进度条渲染出来再开始阻塞主线程，这里保留同样的让步。
 */
function runDeferred(work, label) {
  busy.value = true;
  progress.visible = true;
  setTimeout(() => {
    try {
      work();
      hideProgressSoon();
    } catch (error) {
      fail(error, label);
    } finally {
      busy.value = false;
    }
  }, 50);
}

// ---------- 选择图片 ----------
function onFileSelect(file) {
  if (!file.type.startsWith('image/')) {
    // 旧代码这里是 alert()，换成 naive-ui 的消息提示，文案不变
    message.error(t('alert.image'));
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    // 注意：与迁移前一致，换图不会清空已有结果
    imageSrc.value = event.target.result;
  };
  reader.readAsDataURL(file);
}

// ---------- 智能拆分 ----------
function onSmartCrop() {
  const canvas = stage.value && stage.value.getCroppedCanvas();
  if (!canvas) {
    message.error(CANVAS_UNAVAILABLE);
    return;
  }
  runDeferred(() => {
    results.value = assignIds(runSmartCrop(canvas, report));
  }, 'smartCrop');
}

// ---------- 手动拆分 ----------
function onManualCrop() {
  const canvas = stage.value && stage.value.getCroppedCanvas();
  if (!canvas) {
    message.error(CANVAS_UNAVAILABLE);
    return;
  }
  const item = manualCropOne(canvas);
  results.value = [...results.value, { ...item, id: nextId++ }];
}

// ---------- 网格拆分 ----------
function onGridSplit() {
  const canvas = stage.value && stage.value.getCroppedCanvas();
  if (!canvas) {
    message.error(CANVAS_UNAVAILABLE);
    return;
  }
  runDeferred(() => {
    results.value = assignIds(runGridSplit(canvas, report));
  }, 'gridSplit');
}

// ---------- 先去底再拆分 ----------
function onBgRemoveThenCrop() {
  const canvas = stage.value && stage.value.getCroppedCanvas();
  if (!canvas) {
    message.error(CANVAS_UNAVAILABLE);
    return;
  }
  runDeferred(() => {
    results.value = assignIds(runBgRemoveThenCrop(canvas, report));
  }, 'bgRemoveThenCrop');
}

// ---------- 一键去底 ----------
async function onBgRemove() {
  busy.value = true;
  progress.visible = true;
  report(0, '准备中...');

  try {
    // 旧实现：结果为空时先自己调一次 smartCrop 再 await 100ms（时序不可靠）。
    // 这里改成明确地先跑一次智能拆分，语义更清晰，效果一致。
    if (results.value.length === 0) {
      const canvas = stage.value && stage.value.getCroppedCanvas();
      if (!canvas) {
        message.error(CANVAS_UNAVAILABLE);
        progress.visible = false;
        return;
      }
      results.value = assignIds(runSmartCrop(canvas, report));
    }

    if (results.value.length === 0) {
      // 旧代码里的 alert 文案，保持原样
      message.warning('请先进行智能拆分！');
      progress.visible = false;
      return;
    }

    results.value = assignIds(await runBackgroundRemove(results.value, report));
    hideProgressSoon();
  } catch (error) {
    fail(error, 'backgroundRemove');
  } finally {
    busy.value = false;
  }
}

// ---------- 打包下载 ----------
async function onDownloadAll() {
  if (results.value.length === 0) return;

  busy.value = true;
  progress.visible = true;
  report(0, '正在准备导出...');

  try {
    await downloadAllAsZip(results.value, (percent) => report(percent, '正在生成ZIP文件...'));
    report(100, '导出完成！');
    hideProgressSoon();
  } catch (error) {
    fail(error, 'downloadAll');
  } finally {
    busy.value = false;
  }
}

// ---------- 单张下载 / 删除 ----------
function onDownloadOne(index) {
  const image = results.value[index];
  if (image) downloadImage(image, index);
}

function onDeleteOne(index) {
  results.value = results.value.filter((_, i) => i !== index);
}

// ---------- 重置 ----------
function onReset() {
  // 清空 src 会触发 CropStage 的 watch，进而 destroy 掉 cropper 实例
  imageSrc.value = '';
  results.value = [];
  progress.visible = false;
  progress.percent = 0;
  progress.text = '';
}

// ---------- 语言切换 ----------
// 统一在 watcher 里同步 SEO meta（title / description / keywords / og / twitter / JSON-LD），
// 保证「地址栏语言 = 页面语言 = meta 语言」，对应旧 applyI18n() 的 SEO 部分。
watch(
  () => i18n.lang,
  (lang) => applySeoMeta(lang)
);

function onChangeLang(lang) {
  setLang(lang);
}

// ---------- 初始化 ----------
onMounted(async () => {
  await initImgProc();
  console.info(`[ImgCrop] 图像处理核心：${usingWasm() ? 'WebAssembly' : 'JS 回退'}`);
});
</script>

<template>
  <div>
    <NavBar @change-lang="onChangeLang" />

    <div class="container">
      <HeroHeader />

      <div class="tool-card">
        <!-- 演示指引（移动端隐藏，与迁移前一致） -->
        <div class="demo-guide">
          <div class="demo-step">{{ t('demo.step1') }}</div>
          <div class="demo-arrow">→</div>
          <div class="demo-step">{{ t('demo.step2') }}</div>
          <div class="demo-arrow">→</div>
          <div class="demo-step">{{ t('demo.step3') }}</div>
        </div>

        <!-- 上传区：选图后进入紧凑模式，虚线框保留以便换图 -->
        <UploadZone :compact="hasImage" @select="onFileSelect" />

        <!-- 加载提示 -->
        <div v-if="busy" class="loading">
          <n-spin size="small" />
          <span class="loading-text">{{ t('loading') }}</span>
        </div>

        <!-- 裁剪舞台 -->
        <CropStage ref="stage" :src="imageSrc" />

        <!-- 操作按钮组 -->
        <ToolActions
          :has-image="hasImage"
          :has-results="hasResults"
          :busy="busy"
          @smart-crop="onSmartCrop"
          @manual-crop="onManualCrop"
          @grid-split="onGridSplit"
          @download-all="onDownloadAll"
          @reset="onReset"
          @bg-remove="onBgRemove"
          @bg-remove-then-crop="onBgRemoveThenCrop"
        />

        <!-- 进度条 -->
        <ProgressPanel v-if="progress.visible" :percent="progress.percent" :text="progress.text" />

        <!-- 工具内广告位 -->
        <AdSlot
          :container-id="AD_IN_TOOL.containerId"
          :script-src="AD_IN_TOOL.scriptSrc"
          :cf-async-false="AD_IN_TOOL.cfAsyncFalse"
          :async="AD_IN_TOOL.async"
          :min-height="AD_IN_TOOL.minHeight"
        />

        <!-- 拆分结果 -->
        <ResultGrid
          v-if="hasResults"
          :images="results"
          @download="onDownloadOne"
          @delete="onDeleteOne"
        />
      </div>

      <!-- 中部广告位 -->
      <AdSlot
        :at-options="AD_MIDDLE.atOptions"
        :script-src="AD_MIDDLE.scriptSrc"
        :async="AD_MIDDLE.async"
        :min-height="AD_MIDDLE.minHeight"
      />

      <FeatureGrid />
      <SeoContent />
      <FaqSection />
    </div>

    <AppFooter />
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.tool-card {
  background: #fff;
  border-radius: 24px;
  padding: 40px;
  box-shadow: var(--shadow-lg);
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  overflow: hidden;
}

.demo-guide {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  color: var(--text-light);
  font-size: 0.9rem;
  font-weight: 500;
}

.demo-step {
  display: flex;
  align-items: center;
  gap: 6px;
}

.demo-arrow {
  color: #cbd5e1;
}

.loading {
  margin-top: 20px;
  color: var(--primary);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-text {
  vertical-align: middle;
}

@media (max-width: 768px) {
  .demo-guide {
    display: none;
  }

  .tool-card {
    padding: 25px 15px;
  }
}
</style>
