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

const placeholder = props.placeholder ?? '在这张纸上写点什么吧…'
</script>
