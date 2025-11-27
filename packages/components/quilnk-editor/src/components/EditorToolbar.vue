<template>
  <div class="quilnk-editor__toolbar">
    <!-- 文本格式 -->
    <div class="quilnk-editor__toolbar-group">
      <button
        class="quilnk-editor__toolbar-btn"
        type="button"
        :aria-label="'加粗'"
        @click="$emit('command', 'bold')"
      >
        B
      </button>
      <button
        class="quilnk-editor__toolbar-btn"
        type="button"
        :aria-label="'斜体'"
        @click="$emit('command', 'italic')"
      >
        I
      </button>
      <button
        class="quilnk-editor__toolbar-btn"
        type="button"
        :aria-label="'下划线'"
        @click="$emit('command', 'underline')"
      >
        U
      </button>
      <button
        class="quilnk-editor__toolbar-btn"
        type="button"
        :aria-label="'删除线'"
        @click="$emit('command', 'strikeThrough')"
      >
        S
      </button>
    </div>
    
    <!-- 对齐方式 -->
    <div class="quilnk-editor__toolbar-group">
      <button
        class="quilnk-editor__toolbar-btn"
        type="button"
        :aria-label="'左对齐'"
        @click="$emit('command', 'justifyLeft')"
      >
        左
      </button>
      <button
        class="quilnk-editor__toolbar-btn"
        type="button"
        :aria-label="'居中对齐'"
        @click="$emit('command', 'justifyCenter')"
      >
        中
      </button>
      <button
        class="quilnk-editor__toolbar-btn"
        type="button"
        :aria-label="'右对齐'"
        @click="$emit('command', 'justifyRight')"
      >
        右
      </button>
      <button
        class="quilnk-editor__toolbar-btn"
        type="button"
        :aria-label="'两端对齐'"
        @click="$emit('command', 'justifyFull')"
      >
        两
      </button>
    </div>
    
    <!-- 缩进 -->
    <div class="quilnk-editor__toolbar-group">
      <button
        class="quilnk-editor__toolbar-btn"
        type="button"
        :aria-label="'减少缩进'"
        @click="$emit('command', 'outdent')"
      >
        ←
      </button>
      <button
        class="quilnk-editor__toolbar-btn"
        type="button"
        :aria-label="'增加缩进'"
        @click="$emit('command', 'indent')"
      >
        →
      </button>
    </div>
    
    <!-- 撤销重做 -->
    <div class="quilnk-editor__toolbar-group">
      <button
        class="quilnk-editor__toolbar-btn"
        type="button"
        :aria-label="'撤销'"
        @click="$emit('undo')"
      >
        撤销
      </button>
      <button
        class="quilnk-editor__toolbar-btn"
        type="button"
        :aria-label="'重做'"
        @click="$emit('redo')"
      >
        重做
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: "EditorToolbar" });

defineEmits<{
  (e: "command", command: string): void;
  (e: "undo"): void;
  (e: "redo"): void;
}>();
</script>