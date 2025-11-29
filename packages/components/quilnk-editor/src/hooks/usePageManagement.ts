import { ref } from 'vue';

interface Page {
  id: string;
  content: string;
}

// 生成唯一页面ID
function generatePageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function usePageManagement(initialContent: string = '') {
  const pages = ref<Page[]>([{ id: generatePageId(), content: initialContent }]);
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

  // 聚焦到指定页面 - 只允许聚焦到索引为0的页面
  function focusPage(index: number) {
    if (index === 0 && pageRefs.value[0]) {
      pageRefs.value[0].focus();
      currentPageIndex.value = 0;
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
