import { watch, nextTick, ref } from 'vue';
import { useCaretManagement } from './useCaretManagement';

interface Page {
  id: string;
  content: string;
}

interface HistoryRecord {
  pages: Page[];
  content: string;
  caretPosition: number;
  currentPageIndex: number;
}

export function useDataSync(
  pages: { value: Page[] },
  pageRefs: { value: (HTMLDivElement | null)[] },
  initialContent: string = '',
  emit: (e: 'update:modelValue', value: string) => void
) {
  const { getCaretPosition, setCaretPosition } = useCaretManagement();
  
  // 操作历史管理
  const history = ref<HistoryRecord[]>([]);
  const historyIndex = ref(-1);
  const MAX_HISTORY = 50; // 最大历史记录数
  
  // 保存当前状态到历史记录
  function saveToHistory() {
    // 如果当前不是在历史记录的末尾，清除后面的历史
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }
    
    // 获取当前光标位置和当前页面索引
    let caretPosition = 0;
    const currentPageIndex = pages.value.findIndex((_, index) => {
      const pageElement = pageRefs.value[index];
      if (pageElement && document.activeElement === pageElement) {
        caretPosition = getCaretPosition(pageElement);
        return true;
      }
      return false;
    });
    
    // 创建当前状态的深拷贝
    const currentState: HistoryRecord = {
      pages: JSON.parse(JSON.stringify(pages.value)),
      content: getContent(),
      caretPosition,
      currentPageIndex: currentPageIndex >= 0 ? currentPageIndex : 0
    };
    
    // 添加到历史记录
    history.value.push(currentState);
    
    // 如果历史记录超过最大限制，移除最旧的记录
    if (history.value.length > MAX_HISTORY) {
      history.value.shift();
    } else {
      historyIndex.value++;
    }
  }
  // 收集所有页面内容
  function getContent(): string {
    return pages.value
      .map((page) => page.content)
      .filter((content) => content.trim() !== '')
      .join('\n\n---\n\n'); // 用分隔符区分页面
  }
  
  // 设置编辑器内容
  function setContent(content: string) {
    if (!content) {
      // 如果值为空，重置为单页空内容
      pages.value = [{ id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, content: '' }];
      pageRefs.value = [null];
      
      // 直接设置DOM内容
      nextTick(() => {
        pages.value.forEach((page, index) => {
          if (pageRefs.value[index]) {
            pageRefs.value[index].innerHTML = page.content;
          }
        });
      });
      return;
    }
    
    // 如果当前内容与新值相同，不更新
    const currentContent = getContent();
    if (currentContent === content) {
      return;
    }
    
    // 分割新值为多页
    const pageContents = content.split('\n\n---\n\n');
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
      const currentContent = getContent();
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

  // 检测内容是否超出页面
  function isContentOverflowing(pageElement: HTMLElement): boolean {
    return pageElement.scrollHeight > pageElement.clientHeight;
  }

  // 分割内容到新页面
  function splitContentToNewPage(pageIndex: number, currentPageElement?: HTMLDivElement) {
    const currentPage = pages.value[pageIndex];
    const pageElement = currentPageElement || pageRefs.value[pageIndex];
    
    if (!pageElement) return;

    // 检查内容是否超出页面
    if (!isContentOverflowing(pageElement)) {
      return;
    }
    
    // 获取当前页面的所有子节点
    const childNodes = Array.from(pageElement.childNodes);
    
    // 创建新页面
    const newPage: Page = {
      id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: '',
    };
    
    // 插入新页面
    pages.value.splice(pageIndex + 1, 0, newPage);
    pageRefs.value.splice(pageIndex + 1, 0, null);
    
    // 更新DOM内容
    nextTick(() => {
      const newPageElement = pageRefs.value[pageIndex + 1];
      if (newPageElement && pageElement) {
        // 检查是否是连续换行导致的溢出
        const isLineBreakOverflow = childNodes.length > 0 && 
          childNodes.every(node => 
            node.nodeType === Node.TEXT_NODE && 
            (node.textContent || '').trim() === ''
          );
        
        if (isLineBreakOverflow) {
          // 如果是连续换行导致的溢出，保留当前页面的内容
          // 只在新页面添加一个空的换行符
          newPageElement.innerHTML = '<br>';
          
          // 更新页面数据
          pages.value[pageIndex + 1].content = '<br>';
        } else {
          // 否则，将最后一个节点移动到新页面
          if (childNodes.length > 0) {
            const lastNode = childNodes[childNodes.length - 1];
            newPageElement.appendChild(lastNode.cloneNode(true));
            lastNode.remove();
            
            // 更新页面数据
            pages.value[pageIndex].content = pageElement.innerHTML;
            pages.value[pageIndex + 1].content = newPageElement.innerHTML;
          }
        }
        
        // 聚焦到新页面的开头
        focusNewPage(pageIndex + 1);
      }
    });
  }
  
  // 聚焦到新页面
  function focusNewPage(pageIndex: number) {
    nextTick(() => {
      const newPageElement = pageRefs.value[pageIndex];
      if (newPageElement) {
        newPageElement.focus();
        // 设置光标到新页面开头
        setCaretPosition(newPageElement, 0);
      }
    });
  }

  // 撤销操作
  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      const record = history.value[historyIndex.value];
      if (record) {
        // 恢复历史状态
        pages.value = JSON.parse(JSON.stringify(record.pages));
        
        // 更新DOM内容
        nextTick(() => {
          pages.value.forEach((page, index) => {
            if (pageRefs.value[index]) {
              pageRefs.value[index].innerHTML = page.content;
            }
          });
          
          // 恢复光标位置
          const targetPageElement = pageRefs.value[record.currentPageIndex];
          if (targetPageElement) {
            targetPageElement.focus();
            setCaretPosition(targetPageElement, record.caretPosition);
          }
          
          // 发送更新事件
          emit('update:modelValue', record.content);
        });
      }
    }
  }
  
  // 重做操作
  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      const record = history.value[historyIndex.value];
      if (record) {
        // 恢复历史状态
        pages.value = JSON.parse(JSON.stringify(record.pages));
        
        // 更新DOM内容
        nextTick(() => {
          pages.value.forEach((page, index) => {
            if (pageRefs.value[index]) {
              pageRefs.value[index].innerHTML = page.content;
            }
          });
          
          // 恢复光标位置
          const targetPageElement = pageRefs.value[record.currentPageIndex];
          if (targetPageElement) {
            targetPageElement.focus();
            setCaretPosition(targetPageElement, record.caretPosition);
          }
          
          // 发送更新事件
          emit('update:modelValue', record.content);
        });
      }
    }
  }
  
  // 处理输入事件
  function onInput(event: Event, pageIndex: number) {
    const target = event.target as HTMLDivElement;
    if (!target) return;

    // 保存当前状态到历史记录
    saveToHistory();
    
    // 更新页面内容
    pages.value[pageIndex].content = target.innerHTML;

    // 检测内容是否超出页面
    // 当内容超出页面时，总是尝试分割内容到新页面
    if (isContentOverflowing(target)) {
      splitContentToNewPage(pageIndex, target);
    }

    // 发送更新事件
    emit('update:modelValue', getContent());
  }

  return {
    getContent,
    setContent,
    initializeContent,
    setupModelValueWatch,
    onInput,
    undo,
    redo,
  };
}
