<template>
  <div class="wrap">
    <div class="top-bar">
      <bp-button type="plain" status="gray" @click="addPage">新增一页</bp-button>
      <bp-button type="plain" status="gray" @click="printContent">打印内容</bp-button>
      <bp-button type="plain" status="gray" @click="initializeContent">初始化内容</bp-button>
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

const testStr = `<p>是啊大多数的大师大师大师的是的撒打算打撒打算打撒打撒打撒啊大师大师大师的是的撒打算打撒打算打撒打撒打撒啊大师大师大师的是的撒打算打撒打算打撒打撒打撒啊大师大师大师的是的撒打算打撒打算打撒打撒打撒啊</p>`;

const initializeContent = () => {
  editorRef.value?.setContent(testStr);
};

const printContent = () => {
  console.log(editorRef.value?.getContent());
};
</script>

<style scoped lang="scss">
@use "./app.scss";
</style>
