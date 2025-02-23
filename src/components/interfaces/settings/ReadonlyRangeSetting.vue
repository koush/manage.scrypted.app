<template>
  <div class="mb-4">
    <v-list-item-subtitle class="shrink ml-3 mr-3 mb-1" v-if="title">{{
      title }}</v-list-item-subtitle>
    <v-progress-linear :color="color" :model-value="n" :max="modelValue.range[1]" height="20" rounded>
      <template v-slot:default>
        <div>
          {{ modelValue.value }}/{{ modelValue.range[1] }} {{ modelValue.placeholder }}
        </div>
      </template>
    </v-progress-linear>
    <v-list-item-subtitle class="shrink ml-3 mr-3 mt-1" v-if="description">{{
      description }}</v-list-item-subtitle>
    <v-divider class="mt-2 mb-2"></v-divider>
  </div>
</template>

<script setup lang="ts">
import { Setting } from '@scrypted/types';
import { computed } from 'vue';
import { chipColor } from '../settings-common';
import { isDark } from '@/common/colors';
const dark = isDark();

const props = defineProps<{
  hideTitle?: boolean;
}>();

const title = computed(() => {
  if (props.hideTitle)
    return undefined;
  return modelValue.value.title;
});

const description = computed(() => {
  if (props.hideTitle)
    return undefined;
  return modelValue.value.description;
});

const color = computed(() => {
  return dark.value ? chipColor : 'light-blue-darken-1';
});

const modelValue = defineModel<Setting>();

const n = computed(() => modelValue.value.value as number);


</script>
<style scoped>
.shrink {
  transform: scale(.75, .75);
  width: 120%;
  transform-origin: 0% 50%;
}
</style>
