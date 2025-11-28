<template>
  <div class="quilnk-editor__toolbar">
    <!-- 文本格式 -->
    <div class="quilnk-editor__toolbar-group">
      <button class="quilnk-editor__toolbar-btn" type="button" :aria-label="'加粗'" @click="$emit('command', 'bold')">
        <IconBold size="16" />
      </button>
      <button class="quilnk-editor__toolbar-btn" type="button" :aria-label="'斜体'" @click="$emit('command', 'italic')">
        <IconItalic size="16" />
      </button>
      <button class="quilnk-editor__toolbar-btn" type="button" :aria-label="'下划线'" @click="$emit('command', 'underline')">
        <IconUnderline size="16" />
      </button>
      <button class="quilnk-editor__toolbar-btn" type="button" :aria-label="'删除线'" @click="$emit('command', 'strikeThrough')">
        <IconStrikethrough size="16" />
      </button>
    </div>

    <!-- 对齐方式 -->
    <div class="quilnk-editor__toolbar-group">
      <button class="quilnk-editor__toolbar-btn" type="button" :aria-label="'左对齐'" @click="$emit('command', 'justifyLeft')">
        <IconAlignLeft size="16" />
      </button>
      <button class="quilnk-editor__toolbar-btn" type="button" :aria-label="'居中对齐'" @click="$emit('command', 'justifyCenter')">
        <IconAlignCenter size="16" />
      </button>
      <button class="quilnk-editor__toolbar-btn" type="button" :aria-label="'右对齐'" @click="$emit('command', 'justifyRight')">
        <IconAlignRight size="16" />
      </button>
      <button class="quilnk-editor__toolbar-btn" type="button" :aria-label="'两端对齐'" @click="$emit('command', 'justifyFull')">
        <IconAlignJustify size="16" />
      </button>
    </div>

    <!-- 缩进 -->
    <div class="quilnk-editor__toolbar-group">
      <button class="quilnk-editor__toolbar-btn" type="button" :aria-label="'减少缩进'" @click="$emit('command', 'outdent')">
        <IconIndentIncrease size="16" />
      </button>
      <button class="quilnk-editor__toolbar-btn" type="button" :aria-label="'增加缩进'" @click="$emit('command', 'indent')">
        <IconIndentDecrease size="16" />
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconAlignJustify,
  IconIndentIncrease,
  IconIndentDecrease,
} from "birdpaper-icon";

defineOptions({ name: "EditorToolbar" });

defineEmits<{
  (e: "command", command: string): void;
}>();
</script>
