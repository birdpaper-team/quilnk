import { ref } from 'vue';

interface Page {
  id: string;
  content: string;
}

// 生成唯一页面ID
function generatePageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function usePageManagement() {
  const pages = ref<Page[]>([{ id: generatePageId(), content: '' }]);
  const currentPageIndex = ref(0);
  const pageRefs = ref<(HTMLDivElement | null)[]>([]);

  // 设置页面引用 - 只处理索引为0的页面
  function setPageRef(el: HTMLDivElement | null, index: number) {
    if (el && index === 0) {
      // 确保数组足够大
      while (pageRefs.value.length <= index) {
        pageRefs.value.push(null);
      }
      pageRefs.value[index] = el;
    }
  }

  // 设置当前页面 - 始终设置为0，因为只有一页
  function setCurrentPage(index: number) {
    currentPageIndex.value = 0;
  }

  // 聚焦到指定页面 - 只允许聚焦到索引为0的页面，并将光标设置到内容结尾
  function focusPage(index: number) {
    if (index === 0 && pageRefs.value[0]) {
      const pageElement = pageRefs.value[0];
      pageElement.focus();
      currentPageIndex.value = 0;
      
      // 将光标设置到内容的结尾
      const selection = window.getSelection();
      if (selection) {
        // 移除所有现有的选区
        selection.removeAllRanges();
        
        // 创建一个新的范围，指向内容的结尾
        const range = document.createRange();
        let lastChild = pageElement.lastChild;
        
        // 如果有子元素，找到最深的最后一个子元素
        while (lastChild && lastChild.nodeType === Node.ELEMENT_NODE && lastChild.lastChild) {
          lastChild = lastChild.lastChild;
        }
        
        // 如果最后一个子元素是文本节点，将范围设置到文本的结尾
        if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
          range.setStart(lastChild, lastChild.textContent?.length || 0);
          range.setEnd(lastChild, lastChild.textContent?.length || 0);
        } else {
          // 否则，将范围设置到元素的末尾
          range.setStart(pageElement, pageElement.childNodes.length);
          range.setEnd(pageElement, pageElement.childNodes.length);
        }
        
        // 添加范围到选区
        selection.addRange(range);
      }
    }
  }

  // 获取页面数量 - 始终返回1，因为只有一页
  function getPageCount(): number {
    return 1;
  }

  // 获取当前页面索引 - 始终返回0，因为只有一页
  function getCurrentPageIndex(): number {
    return 0;
  }

  return {
    pages,
    pageRefs,
    currentPageIndex,
    setPageRef,
    setCurrentPage,
    focusPage,
    getPageCount,
    getCurrentPageIndex,
  };
}
