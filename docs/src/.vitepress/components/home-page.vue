<template>
  <div :class="cls">
    <div :class="`${cls}-banner`">
      <img src="https://cos.birdpaper.design/quilnk/v1/logo/logo-home-black.svg" alt="">

      <quilnk-viewer ref="viewerRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const cls = "home-page";

const str = `我希望和你在一起，如果不可以，那我就在你看不见的地方，永远陪着你。`;
const viewerRef = ref();

onMounted(() => {
  if (viewerRef.value) {
    viewerRef.value.setContent(str);
  }
});
</script>
