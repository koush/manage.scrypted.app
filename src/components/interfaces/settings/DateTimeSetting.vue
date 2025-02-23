<template>
  <div>
    <v-list-item-subtitle v-if="modelValue.title && !hideTitle" class="shrink ml-3 mr-3" >{{
      modelValue.title }}</v-list-item-subtitle>
    <V2DatePicker :is-dark="dark" :mode="mode" class="pa-0 ma-0"
      :model-value="new Date(normalizeNumber(modelValue.value as number) || Date.now())"
      :hide-time-header="mode === 'time'" @update:model-value="updateModel"></V2DatePicker>
      <v-divider class="mt-2"></v-divider>
    </div>
</template>
<script setup lang="ts">
import { isDark } from '@/common/colors';
import { Setting } from '@scrypted/types';
import { computed } from 'vue';
import { normalizeNumber } from './setting-modelvalue';

defineProps<{
  hideTitle?: boolean;
}>();

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

.shrink {
  transform: scale(.75, .75);
  width: 120%;
  transform-origin: 0% 50%;
}
</style>
