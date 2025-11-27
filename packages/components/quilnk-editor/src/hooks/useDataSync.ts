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
      content: getAllContent(),
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

  // 检测内容是否超出页面
  function isContentOverflowing(pageElement: HTMLElement): boolean {
    return pageElement.scrollHeight > pageElement.clientHeight;
  }

  // 分割内容到新页面
  function splitContentToNewPage(pageIndex: number) {
    const currentPage = pages.value[pageIndex];
    const currentPageElement = pageRefs.value[pageIndex];
    
    if (!currentPageElement) return;

    // 获取当前光标位置
    const caretPosition = getCaretPosition(currentPageElement);
    
    // 尝试找到合适的分割点
    let splitIndex = caretPosition;
    let textContent = currentPageElement.textContent || '';
    
    // 从光标位置向前查找换行符或空格，作为分割点
    for (let i = caretPosition; i > 0; i--) {
      if (textContent[i] === '\n' || textContent[i] === ' ') {
        splitIndex = i + 1;
        break;
      }
    }
    
    // 如果没有找到合适的分割点，就从光标位置分割
    
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
      if (newPageElement && currentPageElement) {
        // 将超出的内容移动到新页面
        const currentContent = currentPageElement.innerHTML;
        const textContent = currentPageElement.textContent || '';
        
        // 创建一个临时元素来处理HTML内容
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = currentContent;
        
        // 分割HTML内容
        let currentLength = 0;
        let splitNode: Node | null = null;
        let splitOffset = 0;
        
        // 递归查找分割点
        function findSplitPoint(node: Node): boolean {
          if (node.nodeType === Node.TEXT_NODE) {
            const nodeLength = node.textContent?.length || 0;
            if (currentLength + nodeLength > splitIndex) {
              splitNode = node;
              splitOffset = splitIndex - currentLength;
              return true;
            }
            currentLength += nodeLength;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (let i = 0; i < node.childNodes.length; i++) {
              if (findSplitPoint(node.childNodes[i])) {
                return true;
              }
            }
          }
          return false;
        }
        
        findSplitPoint(tempDiv);
        
        if (splitNode) {
          // 创建新的内容片段
          const newContentDiv = document.createElement('div');
          
          // 分割文本节点
          if (splitNode.nodeType === Node.TEXT_NODE) {
            const textNode = splitNode as Text;
            const remainingText = textNode.textContent?.slice(splitOffset) || '';
            textNode.textContent = textNode.textContent?.slice(0, splitOffset) || '';
            
            // 将剩余文本添加到新页面
            newContentDiv.appendChild(document.createTextNode(remainingText));
          }
          
          // 移动剩余的节点
          while (splitNode?.nextSibling) {
            newContentDiv.appendChild(splitNode.nextSibling);
          }
          
          // 移动父节点的剩余子节点
          let parent = splitNode?.parentNode;
          while (parent && parent !== tempDiv) {
            while (parent?.nextSibling) {
              newContentDiv.appendChild(parent.nextSibling);
            }
            parent = parent.parentNode;
          }
          
          // 更新页面内容
          currentPageElement.innerHTML = tempDiv.innerHTML;
          newPageElement.innerHTML = newContentDiv.innerHTML;
          
          // 更新页面数据
          pages.value[pageIndex].content = currentPageElement.innerHTML;
          pages.value[pageIndex + 1].content = newPageElement.innerHTML;
          
          // 聚焦到新页面的开头
          focusNewPage(pageIndex + 1);
        }
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
    if (isContentOverflowing(target)) {
      splitContentToNewPage(pageIndex);
    }

    // 发送更新事件
    emit('update:modelValue', getAllContent());
  }

  return {
    getAllContent,
    initializeContent,
    setupModelValueWatch,
    onInput,
    undo,
    redo,
  };
}
