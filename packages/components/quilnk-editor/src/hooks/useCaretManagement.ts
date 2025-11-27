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

  // 处理空元素的情况
  if (!element.firstChild) {
    const textNode = document.createTextNode('');
    element.appendChild(textNode);
    range.setStart(textNode, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    return;
  }

  let currentOffset = 0;
  let found = false;

  // 递归查找正确的文本节点和偏移量
  function findTextNode(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length || 0;
      
      if (currentOffset + textLength >= offset) {
        const nodeOffset = Math.max(0, offset - currentOffset);
        range.setStart(node, nodeOffset);
        range.collapse(true);
        return true;
      }
      currentOffset += textLength;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // 遍历子节点
      for (let i = 0; i < node.childNodes.length; i++) {
        if (findTextNode(node.childNodes[i])) {
          return true;
        }
      }
    }
    return false;
  }

  // 如果没有找到合适的位置，将光标放在最后
  if (!findTextNode(element)) {
    // 找到最后一个文本节点
    let lastTextNode: Node | null = null;
    
    function findLastTextNode(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        lastTextNode = node;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (let i = node.childNodes.length - 1; i >= 0; i--) {
          findLastTextNode(node.childNodes[i]);
          if (lastTextNode) break;
        }
      }
    }
    
    findLastTextNode(element);
    
    if (lastTextNode) {
      const textLength = lastTextNode.textContent?.length || 0;
      range.setStart(lastTextNode, textLength);
    } else {
      // 如果没有文本节点，创建一个
      const textNode = document.createTextNode('');
      element.appendChild(textNode);
      range.setStart(textNode, 0);
    }
    range.collapse(true);
  }

  sel.removeAllRanges();
  sel.addRange(range);
}

export function useCaretManagement() {
  return {
    getCaretPosition,
    setCaretPosition,
  };
}
