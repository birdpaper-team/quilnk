export function usePasteHandling() {
  // 处理粘贴事件
  function onPaste(event: ClipboardEvent, pageIndex: number) {
    // 阻止默认粘贴行为
    event.preventDefault();

    // 获取剪贴板数据
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    // 尝试获取纯文本内容
    const text = clipboardData.getData('text/plain');
    if (!text) return;

    // 清理文本：移除多余的换行和空格
    const cleanText = text
      .replace(/\r\n/g, '\n') // 统一换行符
      .replace(/\r/g, '\n') // 统一换行符
      .trim(); // 移除首尾空白

    if (!cleanText) return;

    // 获取当前选择范围
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // 删除当前选择的内容
    selection.deleteFromDocument();

    // 将文本按行分割并插入
    const lines = cleanText.split('\n');
    const range = selection.getRangeAt(0);

    lines.forEach((line, index) => {
      // 创建文本节点
      const textNode = document.createTextNode(line);
      range.insertNode(textNode);

      // 如果不是最后一行，添加换行
      if (index < lines.length - 1) {
        const br = document.createElement('br');
        range.insertNode(br);
        range.setStartAfter(br);
      } else {
        range.setStartAfter(textNode);
      }
    });

    // 设置光标位置到插入内容的末尾
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    // 触发input事件以更新modelValue
    const target = event.target as HTMLDivElement;
    const inputEvent = new Event('input', { bubbles: true });
    target.dispatchEvent(inputEvent);
  }

  return {
    onPaste,
  };
}
