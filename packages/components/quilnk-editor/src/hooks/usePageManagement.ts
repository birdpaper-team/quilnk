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

  // 添加新页面
  function addPage(index?: number): number {
    const insertIndex = index !== undefined ? index + 1 : pages.value.length;
    const newPage: Page = {
      id: generatePageId(),
      content: '',
    };

    pages.value.splice(insertIndex, 0, newPage);
    pageRefs.value.splice(insertIndex, 0, null);

    return insertIndex;
  }

  // 删除页面
  function deletePage(index: number): boolean {
    if (pages.value.length <= 1) {
      console.warn('Cannot delete the last page');
      return false;
    }

    if (index < 0 || index >= pages.value.length) {
      console.warn('Invalid page index');
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

  // 获取页面数量
  function getPageCount(): number {
    return pages.value.length;
  }

  // 获取当前页面索引
  function getCurrentPageIndex(): number {
    return currentPageIndex.value;
  }

  return {
    pages,
    pageRefs,
    currentPageIndex,
    setPageRef,
    setCurrentPage,
    addPage,
    deletePage,
    focusPage,
    getPageCount,
    getCurrentPageIndex,
  };
}
