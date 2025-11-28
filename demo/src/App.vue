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

const testStr = `213<br><br>123<br>213<br>12<br>312<br>3<br>12<br>312<br>3<br>1<br>31<br>3<br>1<br>312<br>3<br>13<br>1<br>3<br>13<br>1<br>31<br>3<br><br><br><br>213<br>1<br>3<br><br><br>

---

123<br><br><br>123`;

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
