<script setup>
// 常见问题。迁移前是原生 <details>/<summary> 折叠，这里换成 naive-ui 的 NCollapse。
//
// 注意：答案统一用 v-html 渲染，不能改成普通插值。
// 原因：i18n 里 faq.a6 在四种语言中都含 <br> 换行标签
//（例如 '跨平台：…<br>零安装：…<br>隐私保护：…'），迁移前旧代码用 el.innerHTML = t[key]
// 写入所以换行生效。若用普通插值，用户会直接看到字面的 "<br>"。
// 安全性：这些文案全部来自本仓库自己的 i18n 字典，不含任何用户输入，因此 v-html 在这里是可控的。

import { ref } from 'vue';
import { NCollapse, NCollapseItem } from 'naive-ui';
import { i18n } from '../i18n.js';

const t = (key) => i18n.t(key);

// 默认全部折叠，与迁移前 <details> 不带 open 一致
const expanded = ref([]);

const items = Array.from({ length: 7 }, (_, i) => i + 1);
</script>

<template>
  <section id="faq" class="faq-container">
    <h2 class="faq-header">{{ t('faq.title') }}</h2>

    <n-collapse v-model:expanded-names="expanded">
      <n-collapse-item
        v-for="n in items"
        :key="n"
        :name="n"
        :title="t(`faq.q${n}`)"
      >
        <!-- eslint-disable-next-line vue/no-v-html -- 自有静态文案，含 <br> -->
        <div class="faq-answer" v-html="t(`faq.a${n}`)"></div>
      </n-collapse-item>
    </n-collapse>
  </section>
</template>

<style scoped>
.faq-container {
  margin-bottom: 50px;
}

.faq-header {
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.8rem;
}

.faq-answer {
  color: var(--text-light);
  line-height: 1.7;
  font-size: 0.95rem;
}
</style>
