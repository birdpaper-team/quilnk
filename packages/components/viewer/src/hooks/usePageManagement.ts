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

  return {
    pages,
    pageRefs,
    currentPageIndex,
    setPageRef,
  };
}