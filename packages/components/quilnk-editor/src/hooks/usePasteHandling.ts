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

    // 获取当前选择范围
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // 删除当前选择的内容
    selection.deleteFromDocument();

    // 获取当前范围
    const range = selection.getRangeAt(0);
    
    // 直接使用document.execCommand插入文本，保留原始格式
    // 这是处理粘贴的最佳方式，因为它会自动处理换行和格式
    document.execCommand('insertText', false, text);

    // 触发input事件以更新modelValue
    const target = event.target as HTMLDivElement;
    const inputEvent = new Event('input', { bubbles: true });
    target.dispatchEvent(inputEvent);
  }

  return {
    onPaste,
  };
}
