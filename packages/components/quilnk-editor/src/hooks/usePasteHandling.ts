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

    // 清理文本：统一换行符，删除多余空行
    let cleanText = text
      .replace(/\r\n/g, '\n') // 统一换行符
      .replace(/\r/g, '\n'); // 统一换行符
    
    // 删除多余空行：将连续的换行符替换为单个换行符
    cleanText = cleanText.replace(/\n{3,}/g, '\n\n');
    
    // 删除首尾空白
    cleanText = cleanText.trim();

    if (!cleanText) return;

    // 获取当前选择范围
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // 删除当前选择的内容
    selection.deleteFromDocument();

    // 获取当前范围
    const range = selection.getRangeAt(0);
    
    // 直接使用document.execCommand插入清理后的文本
    document.execCommand('insertText', false, cleanText);

    // 触发input事件以更新modelValue
    const target = event.target as HTMLDivElement;
    const inputEvent = new Event('input', { bubbles: true });
    target.dispatchEvent(inputEvent);
  }

  return {
    onPaste,
  };
}
