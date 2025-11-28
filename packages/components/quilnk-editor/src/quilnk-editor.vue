<template>
  <div :class="clsBlockName">
    <div class="quilnk-editor__stage">
      <div v-for="(page, index) in pages" :key="`page-${page.id}`" class="quilnk-editor__paper">
        <!-- 页面工具栏，只在当前页聚焦时显示 -->
        <div class="quilnk-editor__toolbar-container">
          <transition name="toolbar-fade">
            <EditorToolbar v-if="isToolbarVisible && index === currentPageIndex" :format="currentFormat" @command="executeCommand" />
          </transition>
        </div>
        <div class="quilnk-editor__page">
          <div
            :ref="(el) => setPageRef(el as HTMLDivElement, index)"
            class="quilnk-editor__content font-yrd"
            contenteditable="true"
            spellcheck="true"
            :data-placeholder="index === 0 && pages.length === 1 ? placeholder : ''"
            :data-page-index="index"
            @input="(event) => onInput(event, index)"
            @paste="(event) => onPaste(event, index)"
            @keydown="(event) => onKeyDown(event, index)"
            @keypress="(event) => onKeyPress(event, index)"
            @focus="onPageFocus(index)"
            @blur="onPageBlur" />
          <!-- 页码显示 -->
          <div class="quilnk-editor__page-number">
            {{ formatPageNumber(index + 1, pages.length) }}
          </div>
        </div>
      </div>

      <!-- 添加新页面按钮 -->
      <div class="quilnk-editor__add-page">
        <bp-button type="dashed" @click="() => addPage()" status="gray"> 添加新页 </bp-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, nextTick, ref, watch } from "vue";
import { usePageManagement } from "./hooks/usePageManagement";
import { useKeyboardEvents } from "./hooks/useKeyboardEvents";
import { usePasteHandling } from "./hooks/usePasteHandling";
import { useDataSync } from "./hooks/useDataSync";
import EditorToolbar from "./components/EditorToolbar.vue";

defineOptions({ name: "QuilnkEditor" });

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
  pageNumberFormat?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "pageAdded", pageIndex: number): void;
  (e: "pageDeleted", pageIndex: number, pageCount: number): void;
}>();

const clsBlockName = "quilnk-editor";

// 工具栏显示状态
const isToolbarVisible = ref(false);

// 当前文本格式状态
const currentFormat = ref({
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  justifyLeft: false,
  justifyCenter: false,
  justifyRight: false,
  justifyFull: false,
});

const {
  pages,
  pageRefs,
  currentPageIndex,
  setPageRef,
  setCurrentPage,
  addPage: addPageInternal,
  deletePage: deletePageInternal,
  focusPage,
  getPageCount,
  getCurrentPageIndex,
} = usePageManagement(props.modelValue || "");

const { onPaste } = usePasteHandling();

const { getContent, setContent, initializeContent, setupModelValueWatch, onInput, undo, redo } = useDataSync(
  pages,
  pageRefs,
  props.modelValue || "",
  emit
);

const { onKeyDown, onKeyPress } = useKeyboardEvents(pageRefs.value, undo, redo, deletePage);

// 检测当前选区的格式
function detectCurrentFormat() {
  const formatState = {
    bold: document.queryCommandState("bold"),
    italic: document.queryCommandState("italic"),
    underline: document.queryCommandState("underline"),
    strikeThrough: document.queryCommandState("strikeThrough"),
    justifyLeft: document.queryCommandState("justifyLeft"),
    justifyCenter: document.queryCommandState("justifyCenter"),
    justifyRight: document.queryCommandState("justifyRight"),
    justifyFull: document.queryCommandState("justifyFull"),
  };

  currentFormat.value = formatState;
}

// 页面聚焦事件 - 显示工具栏并检测格式
function onPageFocus(index: number) {
  setCurrentPage(index);
  isToolbarVisible.value = true;
  // 检测当前格式
  detectCurrentFormat();
}

// 页面失焦事件 - 隐藏工具栏
function onPageBlur() {
  // 延迟检查，确保点击工具栏按钮时不会隐藏工具栏
  setTimeout(() => {
    // 检查是否有任何页面内容区域获得焦点
    const hasFocus = Array.from(pageRefs.value).some((page) => document.activeElement === page);
    if (!hasFocus) {
      isToolbarVisible.value = false;
    }
  }, 100);
}

// 监听选区变化，更新格式状态
function setupSelectionListener() {
  // 监听选择变化事件
  document.addEventListener("selectionchange", detectCurrentFormat);

  // 监听鼠标按下事件，检测格式变化
  document.addEventListener("mousedown", detectCurrentFormat);

  // 监听键盘事件，检测格式变化
  document.addEventListener("keyup", detectCurrentFormat);
}

// 包装addPage方法，添加事件触发
function addPage(index?: number): number {
  const insertIndex = addPageInternal(index);

  // 等待DOM更新后聚焦新页面
  nextTick(() => {
    focusPage(insertIndex);
  });

  emit("pageAdded", insertIndex);
  emit("update:modelValue", getContent());

  return insertIndex;
}

// 包装deletePage方法，添加确认和事件触发
function deletePage(index: number) {
  const result = deletePageInternal(index);
  if (result) {
    // 聚焦到合适的页面
    nextTick(() => {
      const targetIndex = Math.min(index, pages.value.length - 1);
      focusPage(targetIndex);
    });

    emit("pageDeleted", index, pages.value.length);
    emit("update:modelValue", getContent());
  }

  return result;
}

onMounted(() => {
  // 初始化内容
  initializeContent();

  // 聚焦第一页
  nextTick(() => {
    focusPage(0);
  });

  // 设置modelValue监听
  setupModelValueWatch(props.modelValue || "");

  // 设置选区监听
  setupSelectionListener();
});

// 执行编辑器命令
function executeCommand(command: string) {
  // 确保编辑器有焦点
  const currentPageElement = pageRefs.value[currentPageIndex.value];
  if (currentPageElement) {
    currentPageElement.focus();
  }

  // 获取当前选择
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  // 执行命令
  document.execCommand(command, false);

  // 触发input事件以更新modelValue
  const inputEvent = new Event("input", { bubbles: true });
  currentPageElement?.dispatchEvent(inputEvent);

  // 更新格式状态
  detectCurrentFormat();
}

// 格式化页码
function formatPageNumber(pageNumber: number, totalPages: number): string {
  const format = props.pageNumberFormat || "第 {page} 页";
  return format.replace(/{page}/g, pageNumber.toString()).replace(/{total}/g, totalPages.toString());
}

// 暴露组件方法
defineExpose({
  addPage,
  deletePage,
  focusPage,
  getContent,
  setContent,
  getPageCount,
  getCurrentPageIndex,
  formatPageNumber,
});

const placeholder = computed(() => props.placeholder ?? "在这张纸上写点什么吧…");
</script>
