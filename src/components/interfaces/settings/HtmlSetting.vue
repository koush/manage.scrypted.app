<template>
  <div class="mt-4">
    <v-list-item-subtitle class="shrink ml-3 mr-3 mb-2" v-if="modelValue.title && !hideTitle">{{ modelValue.title }}</v-list-item-subtitle>
    <div style="font-size: .8rem;" v-html="modelValue.value"></div>
    <v-divider class="mt-2"></v-divider>
  </div>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';

const modelValue = defineModel<Setting>();

defineProps<{
  hideTitle?: boolean;
}>();
</script>
<style scoped>
.shrink {
  transform: scale(.75, .75);
  width: 120%;
  transform-origin: 0% 50%;
}
</style>
