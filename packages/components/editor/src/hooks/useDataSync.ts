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
  pageRefs: { value: (HTMLDivElement | null)[] }
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
  // 收集所有页面内容 - 只返回第一页内容
  function getContent(): string {
    return pages.value[0]?.content || '';
  }
  
  // 设置编辑器内容 - 只处理一页内容
  function setContent(content: string) {
    if (!content) {
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
    if (currentContent === content) {
      return;
    }
    
    // 只设置第一页内容，不再分割为多页
    pages.value[0].content = content;
    
    // 直接设置DOM内容
    nextTick(() => {
      if (pageRefs.value[0]) {
        pageRefs.value[0].innerHTML = content;
      }
    });
  }

  // 初始化内容 - 只处理一页内容
  function initializeContent() {
    // 无需初始化内容，保持默认空状态
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
        });
      }
    }
  }
  
  // 确保内容使用p标签包裹
  function ensureParagraphs(pageElement: HTMLElement) {
    // 检查是否已经有p标签
    const hasParagraphs = Array.from(pageElement.children).some(child => 
      child.tagName.toLowerCase() === 'p' || 
      window.getComputedStyle(child).display === 'block'
    );
    
    if (!hasParagraphs) {
      // 如果没有p标签，创建p标签结构
      const textContent = pageElement.textContent || '';
      const innerHTML = pageElement.innerHTML;
      
      // 清空当前内容
      pageElement.innerHTML = '';
      
      if (textContent.trim() || innerHTML.trim() !== '') {
        // 创建p标签并添加内容
        const pTag = document.createElement('p');
        
        // 如果有HTML内容，使用innerHTML，否则使用textContent
        if (innerHTML.trim() !== '') {
          pTag.innerHTML = innerHTML;
        } else {
          pTag.textContent = textContent;
        }
        
        pageElement.appendChild(pTag);
      }
    } else {
      // 确保所有块级元素都是p标签
      Array.from(pageElement.children).forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const element = child as HTMLElement;
          const tagName = element.tagName.toLowerCase();
          const display = window.getComputedStyle(element).display;
          
          if (display === 'block' && tagName !== 'p') {
            // 将非p标签的块级元素转换为p标签
            const pTag = document.createElement('p');
            pTag.innerHTML = element.innerHTML;
            
            // 复制样式
            pTag.style.cssText = element.style.cssText;
            
            // 替换元素
            element.parentNode?.replaceChild(pTag, element);
          }
        }
      });
    }
  }

  // 处理输入事件 - 移除自动分页逻辑，所有内容都在一页内编辑
  function onInput(event: Event, pageIndex: number) {
    const target = event.target as HTMLDivElement;
    if (!target) return;

    // 保存当前状态到历史记录
    saveToHistory();
    
    // 确保内容使用p标签包裹
    ensureParagraphs(target);
    
    // 更新页面内容
    pages.value[pageIndex].content = target.innerHTML;
  }

  return {
    getContent,
    setContent,
    initializeContent,
    onInput,
    undo,
    redo,
  };
}
