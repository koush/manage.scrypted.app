<template>
  <div class="mb-4">
    <v-divider class="mt-2 mb-2"></v-divider>
    <v-list-item-subtitle class="shrink ml-3 mr-3" v-if="modelValue.title">{{
      modelValue.title }}</v-list-item-subtitle>
    <V2DatePicker :is-dark="dark" :mode="mode"
      :model-value="new Date(normalizeNumber(modelValue.value as number) || Date.now())"
      :hide-time-header="mode === 'time'" @update:model-value="updateModel"></V2DatePicker>
  </div>
</template>
<script setup lang="ts">
import { isDark } from '@/common/colors';
import { Setting } from '@scrypted/types';
import { computed } from 'vue';
import { normalizeNumber } from './setting-modelvalue';

const dark = isDark();
const modelValue = defineModel<Setting>();

function updateModel(v: Date) {
  console.warn(v);
  modelValue.value.value = v.getTime();
}

const mode = computed(() => {
  if (modelValue.value.type === 'date')
    return 'date';
  if (modelValue.value.type === 'time')
    return 'time';
  return 'dateTime';
})
</script>
<style scoped>
/* the borderless prop doesn't seem to work on time picker. */
:deep(.vc-bordered) {
  border: 0px !important;
}
</style>
