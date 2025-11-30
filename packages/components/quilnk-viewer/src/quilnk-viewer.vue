<template>
  <div :class="clsBlockName">
    <div class="quilnk-editor__stage">
      <!-- 只渲染一页内容 -->
      <div class="quilnk-editor__paper">
        <div class="quilnk-editor__page">
          <div
            :ref="(el) => setPageRef(el as HTMLDivElement, 0)"
            class="quilnk-editor__content font-yrd"
            contenteditable="false"
            spellcheck="false"
            :data-placeholder="placeholder"
            v-html="content"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { usePageManagement } from "./hooks/usePageManagement";

defineOptions({ name: "QuilnkViewer" });

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const clsBlockName = "quilnk-editor";

// 内部内容状态
const content = ref(props.modelValue || "");

const placeholder = computed(() => props.placeholder ?? "");

const { setPageRef } = usePageManagement(props.modelValue || "");

// 监听外部内容变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== undefined) {
    content.value = newValue;
  }
});

// 设置内容方法
function setContent(newContent: string) {
  content.value = newContent;
  emit("update:modelValue", newContent);
}

// 暴露组件方法
defineExpose({
  setContent,
});
</script>