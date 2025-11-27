<template>
  <div :class="clsBlockName">
    <div class="quilnk-editor__stage">
      <div
        v-for="(page, index) in pages"
        :key="`page-${page.id}`"
        class="quilnk-editor__paper"
        role="region"
        :aria-label="`信纸第${index + 1}页`">
        <div class="quilnk-editor__page-header">
          <span class="quilnk-editor__page-number">第 {{ index + 1 }} 页</span>
          <button
            v-if="pages.length > 1"
            class="quilnk-editor__delete-btn"
            type="button"
            :aria-label="`删除第${index + 1}页`"
            @click="deletePage(index)">
            ×
          </button>
        </div>
        <div class="quilnk-editor__page">
          <div
            :ref="(el) => setPageRef(el as HTMLDivElement, index)"
            class="quilnk-editor__content"
            contenteditable="true"
            spellcheck="true"
            :data-placeholder="index === 0 && pages.length === 1 ? placeholder : ''"
            :data-page-index="index"
            @input="(event) => onInput(event, index)"
            @paste="(event) => onPaste(event, index)"
            @keydown="(event) => onKeyDown(event, index)"
            @keypress="(event) => onKeyPress(event, index)"
            @focus="setCurrentPage(index)" />
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
import { computed, onMounted, nextTick } from "vue";
import { usePageManagement } from "./hooks/usePageManagement";
import { useKeyboardEvents } from "./hooks/useKeyboardEvents";
import { usePasteHandling } from "./hooks/usePasteHandling";
import { useDataSync } from "./hooks/useDataSync";

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

// 使用页面管理hook
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
  getCurrentPageIndex
} = usePageManagement(props.modelValue || "");

// 使用粘贴处理hook
const { onPaste } = usePasteHandling();

// 使用数据同步hook
const {
  getContent,
  setContent,
  initializeContent,
  setupModelValueWatch,
  onInput,
  undo,
  redo
} = useDataSync(pages, pageRefs, props.modelValue || "", emit);

// 使用键盘事件hook
const { onKeyDown, onKeyPress } = useKeyboardEvents(pageRefs.value, undo, redo);

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
  function deletePage(index: number): boolean {
    // 确认删除
    const confirmDelete = confirm(`确定要删除第 ${index + 1} 页吗？`);
    if (!confirmDelete) {
      return false;
    }

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
});

// 格式化页码
function formatPageNumber(pageNumber: number, totalPages: number): string {
  const format = props.pageNumberFormat || "第 {page} 页";
  return format
    .replace(/{page}/g, pageNumber.toString())
    .replace(/{total}/g, totalPages.toString());
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
  formatPageNumber
});

const placeholder = computed(() => props.placeholder ?? "在这张纸上写点什么吧…");

</script>
