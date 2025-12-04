<template>
  <div :class="name">
    <component :is="tableComponent[type]" :data :lang @copy="handleCopy"></component>
  </div>
</template>

<script setup lang="ts">
import { PropType } from "vue";
import { ApiType, PropItem } from "./types";
import propsTable from "./components/props-table.vue";
import eventTable from "./components/event-table.vue";
import slotTable from "./components/slot-table.vue";
import methodTable from "./components/method-table.vue";
import { useClipboard } from "@vueuse/core";
import { Message } from "birdpaper-ui";
import { locales } from "../../locales";

const name = "api-block";
const props = defineProps({
  type: { type: String as PropType<ApiType>, default: "prop" },
  data: { type: Array as PropType<PropItem[]>, default: () => [] },
  lang: { type: String as PropType<"zh-CN" | "en">, default: "zh-CN" },
});

const tableComponent = {
  prop: propsTable,
  event: eventTable,
  slot: slotTable,
  method: methodTable,
};

const { copy, isSupported } = useClipboard();
const handleCopy = (text: string) => {
  if (!isSupported) {
    return Message.error(locales[props.lang].COPY_ERROR);
  }
  copy(text);
  return Message.success(locales[props.lang].COPY_SUCCESS);
};
</script>
