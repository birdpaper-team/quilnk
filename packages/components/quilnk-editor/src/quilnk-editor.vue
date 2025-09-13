<template>
  <div :class="clsBlockName">
    <div class="quilnk-editor__stage">
      <div class="quilnk-editor__paper" role="region" aria-label="信纸">
        <div class="quilnk-editor__page">
          <div
            ref="contentRef"
            class="quilnk-editor__content"
            contenteditable="true"
            spellcheck="true"
            :data-placeholder="placeholder"
            @input="onInput"
            @paste="onPaste"
            @keydown="onKeyDown"
            @keypress="onKeyPress"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'

defineOptions({ name: 'QuilnkEditor' })

const props = defineProps<{
  modelValue?: string
  placeholder?: string
}>()
const emit = defineEmits<{ (e:'update:modelValue', value:string): void }>()

const clsBlockName = 'quilnk-editor'
const contentRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  if (props.modelValue && contentRef.value && contentRef.value.innerHTML.trim() === '') {
    contentRef.value.innerHTML = props.modelValue
  }
})

function onInput(e: Event) {
  const html = (e.target as HTMLDivElement).innerHTML
  emit('update:modelValue', html)
}

function onPaste(e: ClipboardEvent) {
  // 阻止默认粘贴行为
  e.preventDefault()
  
  // 获取剪贴板数据
  const clipboardData = e.clipboardData
  if (!clipboardData) return
  
  // 尝试获取纯文本内容
  const text = clipboardData.getData('text/plain')
  if (!text) return
  
  // 清理文本：移除多余的换行和空格
  const cleanText = text
    .replace(/\r\n/g, '\n') // 统一换行符
    .replace(/\r/g, '\n')   // 统一换行符
    .trim()                 // 移除首尾空白
  
  if (!cleanText) return
  
  // 获取当前选择范围
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  
  // 删除当前选择的内容
  selection.deleteFromDocument()
  
  // 将文本按行分割并插入
  const lines = cleanText.split('\n')
  const range = selection.getRangeAt(0)
  
  lines.forEach((line, index) => {
    // 创建文本节点
    const textNode = document.createTextNode(line)
    range.insertNode(textNode)
    
    // 如果不是最后一行，添加换行
    if (index < lines.length - 1) {
      const br = document.createElement('br')
      range.insertNode(br)
      range.setStartAfter(br)
    } else {
      range.setStartAfter(textNode)
    }
  })
  
  // 设置光标位置到插入内容的末尾
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  
  // 触发input事件以更新modelValue
  const inputEvent = new Event('input', { bubbles: true })
  contentRef.value?.dispatchEvent(inputEvent)
}

function onKeyDown(e: KeyboardEvent) {
  console.log('Key pressed:', e.key, 'Code:', e.code, 'Shift:', e.shiftKey, 'Target:', e.target) // 调试日志
  
  // 处理 Enter 键 - 换行功能 (优先处理)
  if (e.key === 'Enter' || e.code === 'Enter') {
    console.log('Enter key detected, preventing default immediately')
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    
    // 立即处理换行，不等待任何其他事件
    insertLineBreak()
    return false
  }
  
  // 处理 Tab 键 - 缩进功能
  if (e.key === 'Tab' || e.code === 'Tab') {
    console.log('Tab key detected, preventing default') // 调试日志
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    
    insertTabOrUnindent(e.shiftKey)
    return false
  }
}

function onKeyPress(e: KeyboardEvent) {
  // 额外的Enter键处理，确保在所有情况下都能捕获
  if (e.key === 'Enter' || e.code === 'Enter') {
    console.log('Enter key caught in keypress, preventing default')
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    
    insertLineBreak()
    return false
  }
}

function insertTabOrUnindent(isShiftPressed: boolean) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    console.log('No selection found for tab operation')
    return
  }
  
  let range = selection.getRangeAt(0)
  console.log('Current range:', range)
  
  if (isShiftPressed) {
    // Shift+Tab: 减少缩进
    console.log('Removing indentation - Shift+Tab pressed')
    
    try {
      // 方法1: 使用execCommand删除字符
      let success = false
      
      // 尝试删除最多4个前导空格
      for (let i = 0; i < 4; i++) {
        const container = range.startContainer
        const offset = range.startOffset
        
        console.log(`Attempt ${i + 1}: container type:`, container.nodeType, 'offset:', offset)
        
        if (container.nodeType === Node.TEXT_NODE && container.textContent && offset > 0) {
          const text = container.textContent
          const charBefore = text[offset - 1]
          
          console.log('Character before cursor:', `"${charBefore}"`, 'char code:', charBefore.charCodeAt(0))
          
          // 检查前一个字符是否是空格或nbsp
          if (charBefore === ' ' || charBefore === '\u00A0' || charBefore === '\u0020') {
            // 移动光标到前一个字符
            range.setStart(container, offset - 1)
            range.setEnd(container, offset)
            
            // 删除这个字符
            if (document.execCommand) {
              success = document.execCommand('delete', false) || success
              console.log('execCommand delete result:', success)
            } else {
              // 手动删除
              range.deleteContents()
              success = true
            }
            
            // 更新range位置
            const newSelection = window.getSelection()
            if (newSelection && newSelection.rangeCount > 0) {
              range = newSelection.getRangeAt(0)
            }
          } else {
            console.log('No space character found, stopping unindent')
            break
          }
        } else {
          console.log('Invalid container or position, stopping unindent')
          break
        }
      }
      
      if (!success) {
        console.log('execCommand method failed, trying manual method')
        // 方法2: 手动查找和删除空格
        const container = range.startContainer
        if (container.nodeType === Node.TEXT_NODE && container.textContent) {
          const text = container.textContent
          const offset = range.startOffset
          
          // 查找光标前面连续的空格字符（包括regular space和nbsp）
          let spacesToRemove = 0
          for (let i = offset - 1; i >= 0 && spacesToRemove < 4; i--) {
            const char = text[i]
            if (char === ' ' || char === '\u00A0' || char === '\u0020') {
              spacesToRemove++
            } else {
              break
            }
          }
          
          console.log('Found', spacesToRemove, 'spaces to remove')
          
          if (spacesToRemove > 0) {
            const newText = text.substring(0, offset - spacesToRemove) + text.substring(offset)
            container.textContent = newText
            range.setStart(container, offset - spacesToRemove)
            range.setEnd(container, offset - spacesToRemove)
            selection.removeAllRanges()
            selection.addRange(range)
            console.log('Manual removal completed, removed', spacesToRemove, 'characters')
          }
        }
      }
      
    } catch (e) {
      console.log('Unindent operation failed:', e)
    }
    
  } else {
    // Tab: 增加缩进
    console.log('Adding indentation')
    
    try {
      // 方法1: 使用execCommand命令
      if (document.execCommand) {
        const success = document.execCommand('insertText', false, '    ')
        console.log('execCommand insertText result:', success)
        if (success) {
          triggerInputEvent()
          return
        }
      }
    } catch (e) {
      console.log('execCommand failed, using manual insertion:', e)
    }
    
    // 方法2: 手动插入文本节点
    try {
      range.deleteContents()
      const textNode = document.createTextNode('    ')
      range.insertNode(textNode)
      
      // 移动光标到插入文本后
      range.setStartAfter(textNode)
      range.setEndAfter(textNode)
      selection.removeAllRanges()
      selection.addRange(range)
      
      console.log('Manual text node insertion completed')
    } catch (e) {
      console.log('Manual insertion failed:', e)
      
      // 方法3: 直接在contentRef上操作
      try {
        const contentEl = contentRef.value
        if (contentEl) {
          const currentContent = contentEl.innerHTML
          const caretPos = getCaretPosition(contentEl)
          const newContent = currentContent.slice(0, caretPos) + '&nbsp;&nbsp;&nbsp;&nbsp;' + currentContent.slice(caretPos)
          contentEl.innerHTML = newContent
          setCaretPosition(contentEl, caretPos + 4)
          console.log('Direct innerHTML manipulation completed')
        }
      } catch (e2) {
        console.log('All methods failed:', e2)
      }
    }
  }
  
  // 触发input事件
  triggerInputEvent()
}

// 辅助函数：获取光标位置
function getCaretPosition(element: HTMLElement): number {
  let caretOffset = 0
  const doc = element.ownerDocument || document
  const win = doc.defaultView || window
  const sel = win.getSelection()
  
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(element)
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    caretOffset = preCaretRange.toString().length
  }
  
  return caretOffset
}

// 辅助函数：设置光标位置
function setCaretPosition(element: HTMLElement, offset: number) {
  const range = document.createRange()
  const sel = window.getSelection()
  
  if (sel) {
    range.setStart(element.childNodes[0] || element, offset)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }
}

function insertLineBreak() {
  console.log('Inserting line break')
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    console.log('No selection available for line break')
    return
  }
  
  const range = selection.getRangeAt(0)
  console.log('Range details:', {
    startContainer: range.startContainer,
    startOffset: range.startOffset,
    endContainer: range.endContainer,
    endOffset: range.endOffset,
    collapsed: range.collapsed
  })
  
  try {
    // 方法1: 使用execCommand插入换行
    if (document.execCommand) {
      const success = document.execCommand('insertLineBreak', false)
      console.log('execCommand insertLineBreak result:', success)
      if (success) {
        triggerInputEvent()
        return
      }
      
      // 如果insertLineBreak不支持，尝试insertHTML
      const success2 = document.execCommand('insertHTML', false, '<br>')
      console.log('execCommand insertHTML result:', success2)
      if (success2) {
        triggerInputEvent()
        return
      }
    }
  } catch (e) {
    console.log('execCommand methods failed:', e)
  }
  
  // 方法2: 手动插入br标签
  try {
    console.log('Using manual br insertion method')
    
    // 删除选中的内容（如果有）
    if (!range.collapsed) {
      range.deleteContents()
    }
    
    // 创建换行元素
    const br = document.createElement('br')
    
    // 插入换行元素
    range.insertNode(br)
    
    // 创建一个新的范围，设置在br之后
    const newRange = document.createRange()
    newRange.setStartAfter(br)
    newRange.collapse(true)
    
    // 更新选择
    selection.removeAllRanges()
    selection.addRange(newRange)
    
    console.log('Manual br insertion completed')
    
  } catch (e) {
    console.log('Manual br insertion failed:', e)
    
    // 方法3: 使用innerHTML直接操作
    try {
      console.log('Using innerHTML manipulation method')
      const contentEl = contentRef.value
      if (contentEl) {
        const caretPos = getCaretPosition(contentEl)
        const currentContent = contentEl.innerHTML
        
        // 在光标位置插入br标签
        const newContent = currentContent.slice(0, caretPos) + '<br>' + currentContent.slice(caretPos)
        contentEl.innerHTML = newContent
        
        // 设置光标位置到br标签后
        setCaretPosition(contentEl, caretPos + 4) // <br>标签长度为4
        console.log('innerHTML manipulation completed')
      }
    } catch (e2) {
      console.log('All line break methods failed:', e2)
    }
  }
  
  // 触发input事件
  triggerInputEvent()
}

function triggerInputEvent() {
  setTimeout(() => {
    const inputEvent = new Event('input', { bubbles: true })
    contentRef.value?.dispatchEvent(inputEvent)
  }, 0)
}

const placeholder = props.placeholder ?? '在这张纸上写点什么吧…'
</script>
