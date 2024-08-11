<template>
  <div>
    <v-divider class="mt-2 mb-2"></v-divider>
    <v-btn :readonly="modelValue.readonly" density="compact" variant="tonal" block @click="emits('click-button-setting')">{{ modelValue.title }}</v-btn>
    <v-list-item-subtitle class="shrink ml-3 mr-3" v-if="modelValue.description">{{
      modelValue.description }}</v-list-item-subtitle>
  </div>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';

const modelValue = defineModel<Setting>();

const emits = defineEmits<{
  (event: 'click-button-setting'): void;
}>();

</script>
<style scoped>
.shrink {
  transform: scale(.75, .75);
  width: 120%;
  transform-origin: 0% 50%;
}
</style>
