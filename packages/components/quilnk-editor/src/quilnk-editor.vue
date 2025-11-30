<template>
  <div :class="clsBlockName">
    <div class="quilnk-editor__stage">
      <!-- 只渲染一页内容 -->
      <div class="quilnk-editor__paper" @click="onPaperClick">
        <!-- 页面工具栏，只在当前页聚焦时显示 -->
        <div class="quilnk-editor__toolbar-container">
          <transition name="toolbar-fade">
            <EditorToolbar v-if="isToolbarVisible" :format="currentFormat" @command="(...args) => executeCommand(...args)" />
          </transition>
        </div>
        <div class="quilnk-editor__page">
          <div
            :ref="(el) => setPageRef(el as HTMLDivElement, 0)"
            class="quilnk-editor__content font-yrd"
            contenteditable="true"
            spellcheck="true"
            :data-placeholder="placeholder"
            @input="(event) => onInput(event, 0)"
            @paste="(event) => onPaste(event, 0)"
            @keydown="(event) => onKeyDown(event, 0)"
            @keypress="(event) => onKeyPress(event, 0)"
            @focus="onPageFocus(0)"
            @blur="onPageBlur" />
        </div>
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
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
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

const { onKeyDown, onKeyPress } = useKeyboardEvents(pageRefs.value, undo, redo);

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

// 纸张点击事件处理
function onPaperClick(event: MouseEvent) {
  // 检查点击的目标是否是纸张本身或纸张的直接子元素（除了工具栏）
  const target = event.target as HTMLElement;
  const paperElement = target.closest('.quilnk-editor__paper');
  const contentElement = pageRefs.value[0];
  
  // 如果点击的是纸张区域，且不是内容区域本身，才聚焦到内容区域
  if (paperElement && contentElement && target !== contentElement && !contentElement.contains(target)) {
    focusPage(0);
  }
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
function executeCommand(command: string, value?: string) {
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

  // 处理缩进命令，使用text-indent而不是默认的margin
  if (command === 'indent' || command === 'outdent') {
    const range = selection.getRangeAt(0);
    
    // 查找当前选择范围内的所有p标签
    const pTags = new Set<HTMLElement>();
    
    // 获取选择范围内的所有元素
    const container = range.commonAncestorContainer;
    let startNode = range.startContainer;
    let endNode = range.endContainer;
    
    // 处理简单情况：选择范围在同一个节点内
    if (startNode === endNode) {
      // 向上查找，直到找到p标签或body
      let currentNode = startNode;
      if (currentNode.nodeType === Node.TEXT_NODE) {
        currentNode = currentNode.parentNode as Node;
      }
      
      while (currentNode && currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;
        if (element.tagName.toLowerCase() === 'p') {
          pTags.add(element);
          break;
        }
        currentNode = currentNode.parentNode;
      }
    } else {
      // 处理复杂情况：选择范围跨多个节点
      // 这里简化处理，直接获取所有p标签
      const allPTags = currentPageElement.querySelectorAll('p');
      allPTags.forEach(pTag => pTags.add(pTag as HTMLElement));
    }
    
    // 如果没有找到p标签，尝试获取当前光标所在的p标签
    if (pTags.size === 0) {
      let currentNode = range.startContainer;
      if (currentNode.nodeType === Node.TEXT_NODE) {
        currentNode = currentNode.parentNode as Node;
      }
      
      while (currentNode && currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;
        if (element.tagName.toLowerCase() === 'p') {
          pTags.add(element);
          break;
        }
        currentNode = currentNode.parentNode;
      }
    }
    
    // 应用缩进或取消缩进
    pTags.forEach(pTag => {
      // 直接读取元素的style.textIndent属性，获取原始的em值
      let currentIndent = 0;
      const styleIndent = pTag.style.textIndent;
      
      if (styleIndent) {
        // 提取em值
        const match = styleIndent.match(/^(\d+)em$/);
        if (match) {
          currentIndent = parseInt(match[1], 10);
        }
      }
      
      if (command === 'indent') {
        // 增加缩进 - 在当前基础上增加2em
        const newIndent = currentIndent + 2;
        pTag.style.textIndent = `${newIndent}em`;
        // 清除可能冲突的样式
        pTag.style.marginLeft = '0';
        pTag.style.paddingLeft = '0';
      } else {
        // 减少缩进 - 在当前基础上减少2em，最小为0
        const newIndent = Math.max(0, currentIndent - 2);
        pTag.style.textIndent = `${newIndent}em`;
        // 清除可能冲突的样式
        pTag.style.marginLeft = '0';
        pTag.style.paddingLeft = '0';
        // 如果没有其他样式，移除style属性
        if (pTag.getAttribute('style') === '') {
          pTag.removeAttribute('style');
        }
      }
    });
  } else if (command === 'toggleQuote') {
    // 处理toggleQuote命令，用于添加/移除引用样式
    const range = selection.getRangeAt(0);
    
    // 查找当前选择范围内的所有p标签
    const pTags = new Set<HTMLElement>();
    
    // 获取选择范围内的所有元素
    const container = range.commonAncestorContainer;
    let startNode = range.startContainer;
    let endNode = range.endContainer;
    
    // 处理简单情况：选择范围在同一个节点内
    if (startNode === endNode) {
      // 向上查找，直到找到p标签或body
      let currentNode = startNode;
      if (currentNode.nodeType === Node.TEXT_NODE) {
        currentNode = currentNode.parentNode as Node;
      }
      
      while (currentNode && currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;
        if (element.tagName.toLowerCase() === 'p') {
          pTags.add(element);
          break;
        }
        currentNode = currentNode.parentNode;
      }
    } else {
      // 处理复杂情况：选择范围跨多个节点
      // 这里简化处理，直接获取所有p标签
      const allPTags = currentPageElement.querySelectorAll('p');
      allPTags.forEach(pTag => pTags.add(pTag as HTMLElement));
    }
    
    // 如果没有找到p标签，尝试获取当前光标所在的p标签
    if (pTags.size === 0) {
      let currentNode = range.startContainer;
      if (currentNode.nodeType === Node.TEXT_NODE) {
        currentNode = currentNode.parentNode as Node;
      }
      
      while (currentNode && currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;
        if (element.tagName.toLowerCase() === 'p') {
          pTags.add(element);
          break;
        }
        currentNode = currentNode.parentNode;
      }
    }
    
    // 切换引用样式
    pTags.forEach(pTag => {
      if (pTag.classList.contains('quilnk-editor__content--quote')) {
        // 移除引用样式
        pTag.classList.remove('quilnk-editor__content--quote');
      } else {
        // 添加引用样式
        pTag.classList.add('quilnk-editor__content--quote');
      }
    });
  } else {
    // 其他命令使用默认的document.execCommand行为
    document.execCommand(command, false);
  }

  // 触发input事件以更新modelValue
  const inputEvent = new Event("input", { bubbles: true });
  currentPageElement?.dispatchEvent(inputEvent);

  // 更新格式状态
  detectCurrentFormat();
}

// 暴露组件方法
defineExpose({
  focusPage,
  getContent,
  setContent,
  getPageCount,
  getCurrentPageIndex,
});

const placeholder = computed(() => props.placeholder ?? "在这张纸上写点什么吧…");
</script>
