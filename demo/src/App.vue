<template>
  <div class="wrap">
    <div class="top-bar">
      <bp-button type="plain" status="gray" @click="addPage">新增一页</bp-button>
    </div>

    <div class="container">
      <quilnk-editor ref="editorRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const editorRef = ref();
const addPage = () => {
  editorRef.value?.addPage();
};
</script>

<style scoped lang="scss">
@use "./app.scss";
</style>
