import { watch, nextTick } from 'vue';

interface Page {
  id: string;
  content: string;
}

export function useDataSync(
  pages: { value: Page[] },
  pageRefs: { value: (HTMLDivElement | null)[] },
  initialContent: string = '',
  emit: (e: 'update:modelValue', value: string) => void
) {
  // 收集所有页面内容
  function getAllContent(): string {
    return pages.value
      .map((page) => page.content)
      .filter((content) => content.trim() !== '')
      .join('\n\n---\n\n'); // 用分隔符区分页面
  }

  // 初始化内容
  function initializeContent() {
    if (initialContent) {
      // 如果初始值包含页面分隔符，分割成多页
      const pageContents = initialContent.split('\n\n---\n\n');
      if (pageContents.length > 1) {
        pages.value = pageContents.map((content, index) => ({
          id: index === 0 ? pages.value[0].id : `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: content.trim(),
        }));
        pageRefs.value = Array.from({ length: pages.value.length }, () => null);
      } else {
        pages.value[0].content = initialContent;
      }

      // 直接设置DOM内容
      nextTick(() => {
        pages.value.forEach((page, index) => {
          if (pageRefs.value[index]) {
            pageRefs.value[index].innerHTML = page.content;
          }
        });
      });
    }
  }

  // 监听modelValue变化，同步到内部状态
  function setupModelValueWatch(modelValue: string) {
    watch(() => modelValue, (newValue) => {
      if (!newValue) {
        // 如果值为空，重置为单页空内容
        pages.value = [{ id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, content: '' }];
        pageRefs.value = [null];
        
        // 直接设置DOM内容
        nextTick(() => {
          if (pageRefs.value[0]) {
            pageRefs.value[0].innerHTML = '';
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
      const pageContents = newValue.split('\n\n---\n\n');
      pages.value = pageContents.map((content, index) => ({
        id: index < pages.value.length ? pages.value[index].id : `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
  }

  // 处理输入事件
  function onInput(event: Event, pageIndex: number) {
    const target = event.target as HTMLDivElement;
    if (!target) return;

    // 更新页面内容
    pages.value[pageIndex].content = target.innerHTML;

    // 发送更新事件
    emit('update:modelValue', getAllContent());
  }

  return {
    getAllContent,
    initializeContent,
    setupModelValueWatch,
    onInput,
  };
}
