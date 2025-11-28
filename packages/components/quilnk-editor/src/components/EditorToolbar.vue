<template>
  <div class="quilnk-editor__toolbar">
    <!-- 文本格式 -->
    <div class="quilnk-editor__toolbar-group">
      <button 
        class="quilnk-editor__toolbar-btn" 
        type="button" 
        :aria-label="'加粗'" 
        :class="{ 'quilnk-editor__toolbar-btn--active': format.bold }"
        @click="$emit('command', 'bold')">
        <IconBold size="16" />
      </button>
      <button 
        class="quilnk-editor__toolbar-btn" 
        type="button" 
        :aria-label="'斜体'" 
        :class="{ 'quilnk-editor__toolbar-btn--active': format.italic }"
        @click="$emit('command', 'italic')">
        <IconItalic size="16" />
      </button>
      <button 
        class="quilnk-editor__toolbar-btn" 
        type="button" 
        :aria-label="'下划线'" 
        :class="{ 'quilnk-editor__toolbar-btn--active': format.underline }"
        @click="$emit('command', 'underline')">
        <IconUnderline size="16" />
      </button>
      <button 
        class="quilnk-editor__toolbar-btn" 
        type="button" 
        :aria-label="'删除线'" 
        :class="{ 'quilnk-editor__toolbar-btn--active': format.strikeThrough }"
        @click="$emit('command', 'strikeThrough')">
        <IconStrikethrough size="16" />
      </button>
    </div>

    <!-- 对齐方式 -->
    <div class="quilnk-editor__toolbar-group">
      <button 
        class="quilnk-editor__toolbar-btn" 
        type="button" 
        :aria-label="'左对齐'" 
        :class="{ 'quilnk-editor__toolbar-btn--active': format.justifyLeft }"
        @click="$emit('command', 'justifyLeft')">
        <IconAlignLeft size="16" />
      </button>
      <button 
        class="quilnk-editor__toolbar-btn" 
        type="button" 
        :aria-label="'居中对齐'" 
        :class="{ 'quilnk-editor__toolbar-btn--active': format.justifyCenter }"
        @click="$emit('command', 'justifyCenter')">
        <IconAlignCenter size="16" />
      </button>
      <button 
        class="quilnk-editor__toolbar-btn" 
        type="button" 
        :aria-label="'右对齐'" 
        :class="{ 'quilnk-editor__toolbar-btn--active': format.justifyRight }"
        @click="$emit('command', 'justifyRight')">
        <IconAlignRight size="16" />
      </button>
      <button 
        class="quilnk-editor__toolbar-btn" 
        type="button" 
        :aria-label="'两端对齐'" 
        :class="{ 'quilnk-editor__toolbar-btn--active': format.justifyFull }"
        @click="$emit('command', 'justifyFull')">
        <IconAlignJustify size="16" />
      </button>
    </div>

    <!-- 缩进 -->
    <div class="quilnk-editor__toolbar-group">
      <button 
        class="quilnk-editor__toolbar-btn" 
        type="button" 
        :aria-label="'减少缩进'" 
        @click="$emit('command', 'outdent')">
        <IconIndentIncrease size="16" />
      </button>
      <button 
        class="quilnk-editor__toolbar-btn" 
        type="button" 
        :aria-label="'增加缩进'" 
        @click="$emit('command', 'indent')">
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

// 接收当前格式状态
const props = defineProps<{
  format: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikeThrough: boolean;
    justifyLeft: boolean;
    justifyCenter: boolean;
    justifyRight: boolean;
    justifyFull: boolean;
  };
}>();

defineEmits<{
  (e: "command", command: string): void;
}>();
</script>
