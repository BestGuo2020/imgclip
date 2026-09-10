<script setup>
// 广告位注入组件
//
// 为什么需要它：迁移前广告 <script> 是直接写在 index.html 的 #app 内部的。
// Vue 挂载时会把 #app 的子节点整体替换掉，那些第三方广告 iframe 会随之被销毁，
// 广告位就废了。所以改成由组件在挂载后动态插入 script，并且本组件的 DOM 不依赖任何
// 响应式数据，Vue 不会重新渲染它，广告 iframe 得以长期存活。
//
// 支持两种接入方式：
//   1. 容器式（effectivecpmnetwork）：广告脚本自己找 #container-xxx 渲染
//   2. atOptions 式（highperformanceformat）：需要先把 window.atOptions 设好再加载脚本
//
// 注意：这两个第三方脚本都是外部、不可信资源，且带广告性质，仅按原有配置原样接入。

import { onMounted, ref } from 'vue';

const props = defineProps({
  /** 广告脚本地址 */
  scriptSrc: { type: String, required: true },
  /** 容器式广告需要的容器 id（不传则不渲染容器 div） */
  containerId: { type: String, default: '' },
  /** atOptions 式广告需要的全局配置对象 */
  atOptions: { type: Object, default: null },
  /** 是否 async 加载（原页面里 atOptions 式的那个是同步的） */
  async: { type: Boolean, default: true },
  /** 是否设置 data-cfasync="false"（原页面里容器式那个有这个属性） */
  cfAsyncFalse: { type: Boolean, default: false },
  /** 预留高度，避免广告加载完成前后页面跳动 */
  minHeight: { type: String, default: '100px' },
});

const host = ref(null);

onMounted(() => {
  if (props.atOptions) {
    // atOptions 必须在 invoke.js 执行前就绪，所以先赋值再插 script
    window.atOptions = props.atOptions;
  }
  const el = document.createElement('script');
  el.src = props.scriptSrc;
  if (props.async) el.async = true;
  if (props.cfAsyncFalse) el.setAttribute('data-cfasync', 'false');
  host.value.appendChild(el);
});
</script>

<template>
  <div ref="host" class="ad-slot" :style="{ minHeight }">
    <div v-if="containerId" :id="containerId"></div>
  </div>
</template>

<style scoped>
.ad-slot {
  width: 100%;
  margin: 30px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}
</style>
