<template>
  <div class="wrap" :class="{ dark: currentTheme === 'dark' || (currentTheme === 'system' && isSystemDark) }">
    <div class="top-bar">
      <bp-button type="plain" status="gray" @click="addPage">新增一页</bp-button>
      <bp-button type="plain" status="gray" @click="printContent">打印内容</bp-button>
      <bp-button type="plain" status="gray" @click="initializeContent">初始化内容</bp-button>
      <bp-button type="plain" status="gray" @click="syncToViewer">同步到查看器</bp-button>
      <div class="theme-switcher">
        <span>主题：</span>
        <bp-radio-group v-model="currentTheme" @change="onThemeChange">
          <bp-radio value="light">浅色</bp-radio>
          <bp-radio value="dark">深色</bp-radio>
          <bp-radio value="system">跟随系统</bp-radio>
        </bp-radio-group>
      </div>
    </div>

    <div class="container">
      <div class="editor-section">
        <h2>编辑器</h2>
        <quilnk-editor ref="editorRef" :theme="currentTheme" />
      </div>
      <div class="viewer-section">
        <h2>查看器</h2>
        <quilnk-viewer ref="viewerRef" :theme="currentTheme" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { QuilnkEditor, QuilnkViewer } from "@quilnk/components";

const editorRef = ref();
const viewerRef = ref();

// 主题相关状态
const currentTheme = ref<'light' | 'dark' | 'system'>('system');
const isSystemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);

// 监听系统主题变化
const setupSystemThemeListener = () => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    isSystemDark.value = e.matches;
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleChange);
  });
};

// 主题切换处理
const onThemeChange = () => {
  // 主题变化时，同步更新编辑器和查看器的主题
  // 由于我们已经通过 props 传递了 theme 属性，所以不需要额外操作
};

const addPage = () => {
  editorRef.value?.addPage();
};

const testStr = `<p>是啊大多数的大师大师大师的是的撒打算打撒打算打撒打撒打撒啊大师大师大师的是的撒打算打撒打算打撒打撒打撒啊大师大师大师的是的撒打算打撒打算打撒打撒打撒啊大师大师大师的是的撒打算打撒打算打撒打撒打撒啊</p>`;

const initializeContent = () => {
  editorRef.value?.setContent(testStr);
};

const printContent = () => {
  console.log(editorRef.value?.getContent());
};

const syncToViewer = () => {
  const content = editorRef.value?.getContent();
  if (content) {
    viewerRef.value?.setContent(content);
  }
};

// 组件挂载时设置系统主题监听
onMounted(() => {
  setupSystemThemeListener();
});
</script>

<style scoped lang="scss">
@use "./app.scss";
</style>
