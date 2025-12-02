<template>
  <div :class="clsBlockName" ref="rootElement">
    <div class="quilnk-editor__stage">
      <!-- 只渲染一页内容 -->
      <div class="quilnk-editor__paper">
        <div class="quilnk-editor__page">
          <div
            :ref="(el) => setPageRef(el as HTMLDivElement, 0)"
            class="quilnk-editor__content font-yrd"
            contenteditable="false"
            spellcheck="false"
            :data-placeholder="placeholder"
            v-html="content"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { usePageManagement } from "./hooks/usePageManagement";
import { useNamespace } from "@quilnk/hooks";

defineOptions({ name: "Viewer" });

const props = defineProps<{
  placeholder?: string;
  theme?: 'light' | 'dark' | 'system';
}>();

const { clsBlockName } = useNamespace("editor");

// 内部内容状态
const content = ref("");

const placeholder = computed(() => props.placeholder ?? "");

const { setPageRef } = usePageManagement();

// 主题相关逻辑
const rootElement = ref<HTMLElement | null>(null);

// 计算当前应该使用的主题
const currentTheme = computed(() => {
  if (props.theme === 'light' || props.theme === 'dark') {
    return props.theme;
  }
  // 如果是 'system' 或未指定，检测系统主题
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
});

// 根据主题添加或移除 dark 类名
function updateTheme() {
  if (rootElement.value) {
    if (currentTheme.value === 'dark') {
      rootElement.value.classList.add('dark');
    } else {
      rootElement.value.classList.remove('dark');
    }
  }
}

// 监听主题变化
watch(() => props.theme, updateTheme, { immediate: true });

// 监听系统主题变化
function setupSystemThemeListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', updateTheme);
  
  // 组件卸载时移除监听器
  onUnmounted(() => {
    mediaQuery.removeEventListener('change', updateTheme);
  });
}

// 设置内容方法
function setContent(newContent: string) {
  content.value = newContent;
}

// 组件挂载时初始化主题
onMounted(() => {
  // 设置系统主题监听
  setupSystemThemeListener();
  
  // 初始化主题
  updateTheme();
});

// 暴露组件方法
defineExpose({
  setContent,
});
</script>