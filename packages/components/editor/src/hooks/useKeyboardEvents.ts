import { setCaretPosition, getCaretPosition } from './useCaretManagement';

// 触发input事件
function triggerInputEvent(pageRefs: (HTMLDivElement | null)[], pageIndex: number) {
  const inputEvent = new Event('input', { bubbles: true });
  pageRefs[pageIndex]?.dispatchEvent(inputEvent);
}

// 插入换行 - 创建p标签
function insertLineBreak(pageRefs: (HTMLDivElement | null)[], pageIndex: number) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const pageEl = pageRefs[pageIndex];
  if (!pageEl) return;

  // 检查当前页面是否已经满了
  const isOverflowing = pageEl.scrollHeight > pageEl.clientHeight;
  
  // 如果页面已经满了，不要插入换行符，让onInput事件处理分页
  if (isOverflowing) {
    return;
  }

  const range = selection.getRangeAt(0);
  const paragraph = getOrCreateParagraph(range, pageEl);

  try {
    if (paragraph) {
      // 如果在段落内，将段落分割成两个p标签
      const newParagraph = document.createElement('p');
      
      // 保存当前段落的剩余内容
      const remainingContent = paragraph.cloneNode(true) as HTMLElement;
      remainingContent.innerHTML = '';
      
      // 将光标后的内容移动到新段落
      const afterRange = document.createRange();
      afterRange.setStart(range.endContainer, range.endOffset);
      afterRange.setEndAfter(paragraph.lastChild as Node);
      
      const fragment = afterRange.extractContents();
      newParagraph.appendChild(fragment);
      
      // 在当前段落后面插入新段落
      paragraph.parentNode?.insertBefore(newParagraph, paragraph.nextSibling);
      
      // 清除当前段落的空内容
      if (paragraph.textContent?.trim() === '') {
        paragraph.innerHTML = '';
      }
      
      // 设置光标到新段落的开头
      const newRange = document.createRange();
      newRange.setStart(newParagraph, 0);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // 如果不在段落内，创建一个新的p标签
      const newParagraph = document.createElement('p');
      
      // 插入新段落
      pageEl.appendChild(newParagraph);
      
      // 设置光标到新段落的开头
      const newRange = document.createRange();
      newRange.setStart(newParagraph, 0);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  } catch (e) {
    // 备用方案：使用execCommand
    try {
      if (document.execCommand) {
        // 先确保当前有p标签
        ensureParagraphs(pageEl);
        
        // 使用insertParagraph命令创建新段落
        const success = document.execCommand('insertParagraph', false);
        if (success) {
          // 修复insertParagraph可能创建的div标签为p标签
          const currentParagraph = getOrCreateParagraph(selection.getRangeAt(0), pageEl);
          if (currentParagraph && currentParagraph.tagName.toLowerCase() !== 'p') {
            const pTag = document.createElement('p');
            pTag.innerHTML = currentParagraph.innerHTML;
            currentParagraph.parentNode?.replaceChild(pTag, currentParagraph);
          }
        }
      }
    } catch (e2) {
      // 忽略所有换行方法失败
    }
  }

  // 触发input事件
  triggerInputEvent(pageRefs, pageIndex);
}

// 确保内容使用p标签包裹
function ensureParagraphs(pageElement: HTMLElement) {
  // 如果页面为空，创建一个空的p标签
  if (!pageElement.textContent?.trim() && pageElement.innerHTML.trim() === '') {
    const pTag = document.createElement('p');
    pageElement.appendChild(pTag);
    return;
  }
  
  // 检查是否已经有p标签
  let hasParagraphs = false;
  
  // 遍历所有子元素
  Array.from(pageElement.children).forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      
      if (tagName === 'p') {
        hasParagraphs = true;
      } else {
        // 将非p标签的块级元素转换为p标签
        const pTag = document.createElement('p');
        pTag.innerHTML = element.innerHTML;
        
        // 复制样式
        pTag.style.cssText = element.style.cssText;
        
        // 替换元素
        element.parentNode?.replaceChild(pTag, element);
        hasParagraphs = true;
      }
    }
  });
  
  // 如果没有p标签，创建p标签包裹所有内容
  if (!hasParagraphs) {
    const pTag = document.createElement('p');
    pTag.innerHTML = pageElement.innerHTML;
    pageElement.innerHTML = '';
    pageElement.appendChild(pTag);
  }
}

// 获取或创建当前光标所在的段落元素
function getOrCreateParagraph(range: Range, pageElement: HTMLElement): HTMLElement {
  let currentNode = range.startContainer;
  
  // 如果是文本节点，获取其父元素
  if (currentNode.nodeType === Node.TEXT_NODE) {
    currentNode = currentNode.parentNode as Node;
  }
  
  // 向上查找，直到找到p标签或pageElement
  while (currentNode && currentNode.nodeType === Node.ELEMENT_NODE) {
    const element = currentNode as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    
    // 如果找到p标签，直接返回
    if (tagName === 'p') {
      return element;
    }
    
    // 如果已经到达pageElement，创建p标签
    if (element === pageElement) {
      break;
    }
    
    currentNode = currentNode.parentNode;
  }
  
  // 创建新的p标签
  const pTag = document.createElement('p');
  
  // 如果range有选中内容，将内容移动到新p标签
  if (!range.collapsed) {
    const fragment = range.extractContents();
    pTag.appendChild(fragment);
  }
  
  // 插入新p标签
  if (range.startContainer === pageElement) {
    // 如果光标在pageElement内，直接插入
    pageElement.appendChild(pTag);
  } else {
    // 否则，在光标位置插入
    range.insertNode(pTag);
  }
  
  return pTag;
}

// 插入Tab或取消缩进
function insertTabOrUnindent(isShiftPressed: boolean, pageRefs: (HTMLDivElement | null)[], pageIndex: number) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  const pageElement = pageRefs[pageIndex];
  
  if (!pageElement) {
    return;
  }
  
  // 确保内容使用p标签包裹
  ensureParagraphs(pageElement);
  
  // 获取或创建当前段落
  const paragraph = getOrCreateParagraph(range, pageElement);
  
  if (isShiftPressed) {
    // Shift+Tab: 减少缩进
    try {
      // 直接读取元素的style.textIndent属性，获取原始的em值
      let currentIndent = 0;
      const styleIndent = paragraph.style.textIndent;
      
      if (styleIndent) {
        // 提取em值
        const match = styleIndent.match(/^(\d+)em$/);
        if (match) {
          currentIndent = parseInt(match[1], 10);
        }
      }
      
      // 在当前基础上减少2em，最小为0
      const newIndent = Math.max(0, currentIndent - 2);
      paragraph.style.textIndent = `${newIndent}em`;
      
      // 清除可能冲突的样式
      paragraph.style.marginLeft = '0';
      paragraph.style.paddingLeft = '0';
      
      // 如果没有其他样式，移除style属性
      if (paragraph.getAttribute('style') === '') {
        paragraph.removeAttribute('style');
      }
    } catch (e) {
      // 忽略取消缩进操作失败
    }
  } else {
    // Tab: 增加缩进 - 使用首行缩进
    try {
      // 直接读取元素的style.textIndent属性，获取原始的em值
      let currentIndent = 0;
      const styleIndent = paragraph.style.textIndent;
      
      if (styleIndent) {
        // 提取em值
        const match = styleIndent.match(/^(\d+)em$/);
        if (match) {
          currentIndent = parseInt(match[1], 10);
        }
      }
      
      // 在当前基础上增加2em
      const newIndent = currentIndent + 2;
      paragraph.style.textIndent = `${newIndent}em`;
      
      // 清除可能冲突的样式
      paragraph.style.marginLeft = '0';
      paragraph.style.paddingLeft = '0';
      
      // 确保display属性为block，以便text-indent正常工作
      paragraph.style.display = 'block';
    } catch (e) {
      // 忽略设置缩进失败
    }
  }

  // 触发input事件
  triggerInputEvent(pageRefs, pageIndex);
}

export function useKeyboardEvents(
  pageRefs: (HTMLDivElement | null)[], 
  undo?: () => void, 
  redo?: () => void,
  deletePage?: (index: number) => boolean
) {
  // 处理键盘按下事件
  function onKeyDown(event: KeyboardEvent, pageIndex: number) {
    // 处理常用快捷键
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'a':
          // Ctrl+A: 全选
          event.preventDefault();
          event.stopPropagation();
          const pageElement = pageRefs[pageIndex];
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
        case 'x':
          // 允许默认的复制、剪切行为
          return true;
        case 'z':
          // Ctrl+Z: 撤销
          event.preventDefault();
          event.stopPropagation();
          if (undo) {
            undo();
          }
          return false;
        case 'y':
        case 'shift+z':
          // Ctrl+Y 或 Ctrl+Shift+Z: 重做
          event.preventDefault();
          event.stopPropagation();
          if (redo) {
            redo();
          }
          return false;
      }
    }

    // 处理 Enter 键 - 换行功能 (优先处理)
    if (event.key === 'Enter' || event.code === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      // 立即处理换行，不等待任何其他事件
      insertLineBreak(pageRefs, pageIndex);
      return false;
    }

    // 处理 Tab 键 - 缩进功能
    if (event.key === 'Tab' || event.code === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      insertTabOrUnindent(event.shiftKey, pageRefs, pageIndex);
      return false;
    }

    // 处理删除键 - 自动删除空白页
    if (event.key === 'Backspace' || event.key === 'Delete') {
      const pageElement = pageRefs[pageIndex];
      if (pageElement) {
        // 检查当前页面是否为空
        // 更宽松的空页面检测条件
        const textContent = pageElement.textContent || '';
        const innerHTML = pageElement.innerHTML || '';
        const isEmpty = textContent.trim() === '' && 
                       (innerHTML.trim() === '' || 
                        innerHTML.trim() === '<br>' || 
                        innerHTML.trim() === '<br/>' || 
                        innerHTML.trim() === '<br />');
        
        // 如果页面为空，且不是第一页，且有删除页面的函数
        if (isEmpty && pageIndex > 0 && deletePage) {
          // 阻止默认行为
          event.preventDefault();
          event.stopPropagation();
          
          // 删除当前页面
          const success = deletePage(pageIndex);
          if (success) {
            // 聚焦到上一页
            const prevPageElement = pageRefs[pageIndex - 1];
            if (prevPageElement) {
              prevPageElement.focus();
              // 将光标设置到上一页的末尾
              const range = document.createRange();
              const sel = window.getSelection();
              if (sel) {
                range.selectNodeContents(prevPageElement);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
              }
            }
          }
          return false;
        }
      }
      // 允许默认的删除行为
      return true;
    }

    return true;
  }

  // 处理键盘按键事件
  function onKeyPress(event: KeyboardEvent, pageIndex: number) {
    // 额外的Enter键处理，确保在所有情况下都能捕获
    if (event.key === 'Enter' || event.code === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      insertLineBreak(pageRefs, pageIndex);
      return false;
    }
  }

  return {
    onKeyDown,
    onKeyPress,
  };
}
