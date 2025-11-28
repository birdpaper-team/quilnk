// 辅助函数：获取光标位置
export function getCaretPosition(element: HTMLElement): number {
  let caretOffset = 0;
  const sel = window.getSelection();

  if (!sel || sel.rangeCount === 0) {
    return 0;
  }

  const range = sel.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  // 使用更可靠的方法计算文本偏移量
  let currentOffset = 0;
  let found = false;

  // 递归查找正确的文本节点和偏移量
  function traverseNodes(node: Node): boolean {
    if (node === range.endContainer) {
      currentOffset += range.endOffset;
      return true;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      currentOffset += node.textContent?.length || 0;
      return false;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // 遍历子节点
      for (let i = 0; i < node.childNodes.length; i++) {
        if (traverseNodes(node.childNodes[i])) {
          return true;
        }
      }
    }
    return false;
  }

  if (traverseNodes(element)) {
    caretOffset = currentOffset;
  } else {
    // 如果没有找到光标位置（可能在空元素中），返回0
    caretOffset = 0;
  }

  return caretOffset;
}

// 辅助函数：设置光标位置
export function setCaretPosition(element: HTMLElement, offset: number) {
  const range = document.createRange();
  const sel = window.getSelection();
  
  if (!sel) return;

  // 直接将范围设置到元素的开头，不创建任何额外节点
  range.selectNodeContents(element);
  range.collapse(true);
  
  sel.removeAllRanges();
  sel.addRange(range);
}

export function useCaretManagement() {
  return {
    getCaretPosition,
    setCaretPosition,
  };
}
