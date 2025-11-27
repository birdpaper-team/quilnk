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
import { ref, onMounted, nextTick, computed, watch } from "vue";

defineOptions({ name: "QuilnkEditor" });

interface Page {
  id: string;
  content: string;
}

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "pageAdded", pageIndex: number): void;
  (e: "pageDeleted", pageIndex: number, pageCount: number): void;
}>();

const clsBlockName = "quilnk-editor";
const pages = ref<Page[]>([{ id: generatePageId(), content: props.modelValue || "" }]);
const pageRefs = ref<(HTMLDivElement | null)[]>([]);
const currentPageIndex = ref(0);

// 生成唯一页面ID
function generatePageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 设置页面引用
function setPageRef(el: HTMLDivElement | null, index: number) {
  if (el) {
    // 确保数组足够大
    while (pageRefs.value.length <= index) {
      pageRefs.value.push(null);
    }
    pageRefs.value[index] = el;
  }
}

// 设置当前页面
function setCurrentPage(index: number) {
  currentPageIndex.value = index;
}

// 收集所有页面内容
function getAllContent(): string {
  return pages.value
    .map((page) => page.content)
    .filter((content) => content.trim() !== "")
    .join("\n\n---\n\n"); // 用分隔符区分页面
}

// 添加新页面
function addPage(index?: number): number {
  const insertIndex = index !== undefined ? index + 1 : pages.value.length;
  const newPage: Page = {
    id: generatePageId(),
    content: "",
  };

  pages.value.splice(insertIndex, 0, newPage);
  pageRefs.value.splice(insertIndex, 0, null);

  // 等待DOM更新后聚焦新页面
  nextTick(() => {
    focusPage(insertIndex);
  });

  emit("pageAdded", insertIndex);
  emit("update:modelValue", getAllContent());

  return insertIndex;
}

// 删除页面
function deletePage(index: number): boolean {
  if (pages.value.length <= 1) {
    console.warn("Cannot delete the last page");
    return false;
  }

  if (index < 0 || index >= pages.value.length) {
    console.warn("Invalid page index");
    return false;
  }

  // 确认删除
  const confirmDelete = confirm(`确定要删除第 ${index + 1} 页吗？`);
  if (!confirmDelete) {
    return false;
  }

  pages.value.splice(index, 1);
  pageRefs.value.splice(index, 1);

  // 调整当前页面索引
  if (currentPageIndex.value >= pages.value.length) {
    currentPageIndex.value = pages.value.length - 1;
  } else if (currentPageIndex.value > index) {
    currentPageIndex.value--;
  }

  // 聚焦到合适的页面
  nextTick(() => {
    const targetIndex = Math.min(index, pages.value.length - 1);
    focusPage(targetIndex);
  });

  emit("pageDeleted", index, pages.value.length);
  emit("update:modelValue", getAllContent());

  return true;
}

// 聚焦到指定页面
function focusPage(index: number) {
  if (index >= 0 && index < pageRefs.value.length) {
    const pageElement = pageRefs.value[index];
    if (pageElement) {
      pageElement.focus();
      currentPageIndex.value = index;
    }
  }
}

onMounted(() => {
  // 初始化内容
  if (props.modelValue) {
    // 如果初始值包含页面分隔符，分割成多页
    const pageContents = props.modelValue.split("\n\n---\n\n");
    if (pageContents.length > 1) {
      pages.value = pageContents.map((content, index) => ({
        id: index === 0 ? pages.value[0].id : generatePageId(),
        content: content.trim(),
      }));
      pageRefs.value = Array.from({ length: pages.value.length }, () => null);
    } else {
      pages.value[0].content = props.modelValue;
    }
  }

  // 直接设置DOM内容并聚焦第一页
  nextTick(() => {
    // 设置初始内容到DOM
    pages.value.forEach((page, index) => {
      if (pageRefs.value[index]) {
        pageRefs.value[index].innerHTML = page.content;
      }
    });
    // 聚焦第一页
    focusPage(0);
  });
});

// 暴露组件方法
defineExpose({
  addPage,
  deletePage,
  focusPage,
  getAllContent,
  getPageCount: () => pages.value.length,
  getCurrentPageIndex: () => currentPageIndex.value,
});

// 监听modelValue变化，同步到内部状态
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    // 如果值为空，重置为单页空内容
    pages.value = [{ id: generatePageId(), content: "" }];
    pageRefs.value = [null];
    
    // 直接设置DOM内容
    nextTick(() => {
      if (pageRefs.value[0]) {
        pageRefs.value[0].innerHTML = "";
      }
    });
    return;
  }

  // 如果当前内容与新值相同，不更新
  const currentContent = getAllContent();
  if (currentContent === newValue) {
    return;
  }

  // 分割新值为多页
  const pageContents = newValue.split("\n\n---\n\n");
  pages.value = pageContents.map((content, index) => ({
    id: index < pages.value.length ? pages.value[index].id : generatePageId(),
    content: content.trim(),
  }));
  pageRefs.value = Array.from({ length: pages.value.length }, () => null);
  
  // 直接设置DOM内容
  nextTick(() => {
    pages.value.forEach((page, index) => {
      if (pageRefs.value[index]) {
        pageRefs.value[index].innerHTML = page.content;
      }
    });
  });
});

function onInput(event: Event, pageIndex: number) {
  const target = event.target as HTMLDivElement;
  if (!target) return;

  // 更新页面内容
  pages.value[pageIndex].content = target.innerHTML;

  // 发送更新事件
  emit("update:modelValue", getAllContent());
}

function onPaste(event: ClipboardEvent, pageIndex: number) {
  // 阻止默认粘贴行为
  event.preventDefault();

  // 获取剪贴板数据
  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  // 尝试获取纯文本内容
  const text = clipboardData.getData("text/plain");
  if (!text) return;

  // 清理文本：移除多余的换行和空格
  const cleanText = text
    .replace(/\r\n/g, "\n") // 统一换行符
    .replace(/\r/g, "\n") // 统一换行符
    .trim(); // 移除首尾空白

  if (!cleanText) return;

  // 获取当前选择范围
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  // 删除当前选择的内容
  selection.deleteFromDocument();

  // 将文本按行分割并插入
  const lines = cleanText.split("\n");
  const range = selection.getRangeAt(0);

  lines.forEach((line, index) => {
    // 创建文本节点
    const textNode = document.createTextNode(line);
    range.insertNode(textNode);

    // 如果不是最后一行，添加换行
    if (index < lines.length - 1) {
      const br = document.createElement("br");
      range.insertNode(br);
      range.setStartAfter(br);
    } else {
      range.setStartAfter(textNode);
    }
  });

  // 设置光标位置到插入内容的末尾
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  // 触发input事件以更新modelValue
  const target = event.target as HTMLDivElement;
  const inputEvent = new Event("input", { bubbles: true });
  target.dispatchEvent(inputEvent);
}

function onKeyDown(event: KeyboardEvent, pageIndex: number) {
  // 处理常用快捷键
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'a':
        // Ctrl+A: 全选
        event.preventDefault();
        event.stopPropagation();
        const pageElement = pageRefs.value[pageIndex];
        if (pageElement) {
          const range = document.createRange();
          range.selectNodeContents(pageElement);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
        return false;
      case 'c':
      case 'v':
      case 'x':
      case 'z':
      case 'y':
        // 允许默认的复制、粘贴、剪切、撤销、重做行为
        return true;
    }
  }

  // 处理 Enter 键 - 换行功能 (优先处理)
  if (event.key === "Enter" || event.code === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // 立即处理换行，不等待任何其他事件
    insertLineBreak(pageIndex);
    return false;
  }

  // 处理 Tab 键 - 缩进功能
  if (event.key === "Tab" || event.code === "Tab") {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    insertTabOrUnindent(event.shiftKey, pageIndex);
    return false;
  }

  // 允许删除键的默认行为
  if (event.key === "Backspace" || event.key === "Delete") {
    return true;
  }

  return true;
}

function onKeyPress(event: KeyboardEvent, pageIndex: number) {
  // 额外的Enter键处理，确保在所有情况下都能捕获
  if (event.key === "Enter" || event.code === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    insertLineBreak(pageIndex);
    return false;
  }
}

// 辅助函数：获取光标位置
function getCaretPosition(element: HTMLElement): number {
  let caretOffset = 0;
  const doc = element.ownerDocument || document;
  const win = doc.defaultView || window;
  const sel = win.getSelection();

  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    caretOffset = preCaretRange.toString().length;
  }

  return caretOffset;
}

// 辅助函数：设置光标位置
function setCaretPosition(element: HTMLElement, offset: number) {
  const range = document.createRange();
  const sel = window.getSelection();
  
  if (!sel) return;

  // 处理空元素的情况
  if (!element.firstChild) {
    const textNode = document.createTextNode('');
    element.appendChild(textNode);
    range.setStart(textNode, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    return;
  }

  let currentOffset = 0;
  let found = false;

  // 递归查找正确的文本节点和偏移量
  function findTextNode(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length || 0;
      
      if (currentOffset + textLength >= offset) {
        const nodeOffset = Math.max(0, offset - currentOffset);
        range.setStart(node, nodeOffset);
        range.collapse(true);
        return true;
      }
      currentOffset += textLength;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // 遍历子节点
      for (let i = 0; i < node.childNodes.length; i++) {
        if (findTextNode(node.childNodes[i])) {
          return true;
        }
      }
    }
    return false;
  }

  // 如果没有找到合适的位置，将光标放在最后
  if (!findTextNode(element)) {
    // 找到最后一个文本节点
    let lastTextNode: Node | null = null;
    
    function findLastTextNode(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        lastTextNode = node;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (let i = node.childNodes.length - 1; i >= 0; i--) {
          findLastTextNode(node.childNodes[i]);
          if (lastTextNode) break;
        }
      }
    }
    
    findLastTextNode(element);
    
    if (lastTextNode) {
      const textLength = lastTextNode.textContent?.length || 0;
      range.setStart(lastTextNode, textLength);
    } else {
      // 如果没有文本节点，创建一个
      const textNode = document.createTextNode('');
      element.appendChild(textNode);
      range.setStart(textNode, 0);
    }
    range.collapse(true);
  }

  sel.removeAllRanges();
  sel.addRange(range);
}

function insertLineBreak(pageIndex: number) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);

  try {
    // 方法1: 使用execCommand插入换行
    if (document.execCommand) {
      const success = document.execCommand("insertLineBreak", false);
      if (success) {
        triggerInputEvent(pageIndex);
        return;
      }

      // 如果insertLineBreak不支持，尝试insertHTML
      const success2 = document.execCommand("insertHTML", false, "<br>");
      if (success2) {
        triggerInputEvent(pageIndex);
        return;
      }
    }
  } catch (e) {
    // 忽略execCommand方法失败
  }

  // 方法2: 手动插入br标签
  try {
    // 删除选中的内容（如果有）
    if (!range.collapsed) {
      range.deleteContents();
    }

    // 创建换行元素
    const br = document.createElement("br");

    // 插入换行元素
    range.insertNode(br);

    // 创建一个新的范围，设置在br之后
    const newRange = document.createRange();
    newRange.setStartAfter(br);
    newRange.collapse(true);

    // 更新选择
    selection.removeAllRanges();
    selection.addRange(newRange);
  } catch (e) {
    // 方法3: 使用innerHTML直接操作
    try {
      const pageEl = pageRefs.value[pageIndex];
      if (pageEl) {
        const caretPos = getCaretPosition(pageEl);
        const currentContent = pageEl.innerHTML;

        // 在光标位置插入br标签
        const newContent = currentContent.slice(0, caretPos) + "<br>" + currentContent.slice(caretPos);
        pageEl.innerHTML = newContent;

        // 设置光标位置到br标签后
        setCaretPosition(pageEl, caretPos + 4); // <br>标签长度为4
      }
    } catch (e2) {
      // 忽略所有换行方法失败
    }
  }

  // 触发input事件
  triggerInputEvent(pageIndex);
}

function insertTabOrUnindent(isShiftPressed: boolean, pageIndex: number) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  let range = selection.getRangeAt(0);

  if (isShiftPressed) {
    // Shift+Tab: 减少缩进
    try {
      // 方法1: 使用execCommand删除字符
      let success = false;

      // 尝试删除最多4个前导空格
      for (let i = 0; i < 4; i++) {
        const container = range.startContainer;
        const offset = range.startOffset;

        if (container.nodeType === Node.TEXT_NODE && container.textContent && offset > 0) {
          const text = container.textContent;
          const charBefore = text[offset - 1];

          // 检查前一个字符是否是空格或nbsp
          if (charBefore === " " || charBefore === "\u00A0" || charBefore === "\u0020") {
            // 移动光标到前一个字符
            range.setStart(container, offset - 1);
            range.setEnd(container, offset);

            // 删除这个字符
            if (document.execCommand) {
              success = document.execCommand("delete", false) || success;
            } else {
              // 手动删除
              range.deleteContents();
              success = true;
            }

            // 更新range位置
            const newSelection = window.getSelection();
            if (newSelection && newSelection.rangeCount > 0) {
              range = newSelection.getRangeAt(0);
            }
          } else {
            break;
          }
        } else {
          break;
        }
      }

      if (!success) {
        // 方法2: 手动查找和删除空格
        const container = range.startContainer;
        if (container.nodeType === Node.TEXT_NODE && container.textContent) {
          const text = container.textContent;
          const offset = range.startOffset;

          // 查找光标前面连续的空格字符（包括regular space和nbsp）
          let spacesToRemove = 0;
          for (let i = offset - 1; i >= 0 && spacesToRemove < 4; i--) {
            const char = text[i];
            if (char === " " || char === "\u00A0" || char === "\u0020") {
              spacesToRemove++;
            } else {
              break;
            }
          }

          if (spacesToRemove > 0) {
            const newText = text.substring(0, offset - spacesToRemove) + text.substring(offset);
            container.textContent = newText;
            range.setStart(container, offset - spacesToRemove);
            range.setEnd(container, offset - spacesToRemove);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    } catch (e) {
      // 忽略取消缩进操作失败
    }
  } else {
    // Tab: 增加缩进
    try {
      // 方法1: 使用execCommand命令
      if (document.execCommand) {
        const success = document.execCommand("insertText", false, "    ");
        if (success) {
          triggerInputEvent(pageIndex);
          return;
        }
      }
    } catch (e) {
      // 忽略execCommand失败
    }

    // 方法2: 手动插入文本节点
    try {
      range.deleteContents();
      const textNode = document.createTextNode("    ");
      range.insertNode(textNode);

      // 移动光标到插入文本后
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (e) {
      // 方法3: 直接在pageRef上操作
      try {
        const pageEl = pageRefs.value[pageIndex];
        if (pageEl) {
          const currentContent = pageEl.innerHTML;
          const caretPos = getCaretPosition(pageEl);
          const newContent = currentContent.slice(0, caretPos) + "&nbsp;&nbsp;&nbsp;&nbsp;" + currentContent.slice(caretPos);
          pageEl.innerHTML = newContent;
          setCaretPosition(pageEl, caretPos + 4);
        }
      } catch (e2) {
        // 忽略所有方法失败
      }
    }
  }

  // 触发input事件
  triggerInputEvent(pageIndex);
}

function triggerInputEvent(pageIndex: number) {
  const inputEvent = new Event("input", { bubbles: true });
  pageRefs.value[pageIndex]?.dispatchEvent(inputEvent);
}

const placeholder = computed(() => props.placeholder ?? "在这张纸上写点什么吧…");
</script>
