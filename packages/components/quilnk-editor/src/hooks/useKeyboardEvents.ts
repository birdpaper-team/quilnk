import { setCaretPosition, getCaretPosition } from './useCaretManagement';

// 触发input事件
function triggerInputEvent(pageRefs: (HTMLDivElement | null)[], pageIndex: number) {
  const inputEvent = new Event('input', { bubbles: true });
  pageRefs[pageIndex]?.dispatchEvent(inputEvent);
}

// 插入换行
function insertLineBreak(pageRefs: (HTMLDivElement | null)[], pageIndex: number) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);

  try {
    // 方法1: 使用execCommand插入换行
    if (document.execCommand) {
      const success = document.execCommand('insertLineBreak', false);
      if (success) {
        triggerInputEvent(pageRefs, pageIndex);
        return;
      }

      // 如果insertLineBreak不支持，尝试insertHTML
      const success2 = document.execCommand('insertHTML', false, '<br>');
      if (success2) {
        triggerInputEvent(pageRefs, pageIndex);
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
    const br = document.createElement('br');

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
      const pageEl = pageRefs[pageIndex];
      if (pageEl) {
        const caretPos = getCaretPosition(pageEl);
        const currentContent = pageEl.innerHTML;

        // 在光标位置插入br标签
        const newContent = currentContent.slice(0, caretPos) + '<br>' + currentContent.slice(caretPos);
        pageEl.innerHTML = newContent;

        // 设置光标位置到br标签后
        setCaretPosition(pageEl, caretPos + 4); // <br>标签长度为4
      }
    } catch (e2) {
      // 忽略所有换行方法失败
    }
  }

  // 触发input事件
  triggerInputEvent(pageRefs, pageIndex);
}

// 插入Tab或取消缩进
function insertTabOrUnindent(isShiftPressed: boolean, pageRefs: (HTMLDivElement | null)[], pageIndex: number) {
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
          if (charBefore === ' ' || charBefore === '\u00A0' || charBefore === '\u0020') {
            // 移动光标到前一个字符
            range.setStart(container, offset - 1);
            range.setEnd(container, offset);

            // 删除这个字符
            if (document.execCommand) {
              success = document.execCommand('delete', false) || success;
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
            if (char === ' ' || char === '\u00A0' || char === '\u0020') {
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
        const success = document.execCommand('insertText', false, '    ');
        if (success) {
          triggerInputEvent(pageRefs, pageIndex);
          return;
        }
      }
    } catch (e) {
      // 忽略execCommand失败
    }

    // 方法2: 手动插入文本节点
    try {
      range.deleteContents();
      const textNode = document.createTextNode('    ');
      range.insertNode(textNode);

      // 移动光标到插入文本后
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (e) {
      // 方法3: 直接在pageRef上操作
      try {
        const pageEl = pageRefs[pageIndex];
        if (pageEl) {
          const currentContent = pageEl.innerHTML;
          const caretPos = getCaretPosition(pageEl);
          const newContent = currentContent.slice(0, caretPos) + '&nbsp;&nbsp;&nbsp;&nbsp;' + currentContent.slice(caretPos);
          pageEl.innerHTML = newContent;
          setCaretPosition(pageEl, caretPos + 4);
        }
      } catch (e2) {
        // 忽略所有方法失败
      }
    }
  }

  // 触发input事件
  triggerInputEvent(pageRefs, pageIndex);
}

export function useKeyboardEvents(pageRefs: (HTMLDivElement | null)[], undo?: () => void, redo?: () => void) {
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

    // 允许删除键的默认行为
    if (event.key === 'Backspace' || event.key === 'Delete') {
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
