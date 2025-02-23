<template>
  <v-switch v-if="modelValue?.immediate" :color="chipColor" inset class="shrink" :readonly="modelValue.readonly"
    density="compact" :label="title" persistent-placeholder :hint="description"
    v-model="modelValue.value" :persistent-hint="!!description"
    :hide-details="!description"></v-switch>
  <v-checkbox v-else :color="chipColor" class="shrink" :readonly="modelValue.readonly" density="compact"
    :label="title" persistent-placeholder :hint="description" v-model="modelValue.value"
    :persistent-hint="!!description" :hide-details="!description"></v-checkbox>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';
import { chipColor } from '../settings-common';
import { computed } from 'vue';

const modelValue = defineModel<Setting>();
const props = defineProps<{
  hideTitle?: boolean;
}>();

const title = computed(() => {
  if (props.hideTitle)
    return modelValue.value.description;
  return modelValue.value.title;
});

const description = computed(() => {
  if (props.hideTitle)
    return undefined;
  return modelValue.value.description;
});

</script>
<style scoped>
.shrink {
  transform: scale(.8, .8);
  width: 125%;
  transform-origin: 0% 50%;
}
</style>
