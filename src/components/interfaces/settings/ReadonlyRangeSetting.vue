<template>
  <div class="mb-4">
    <v-divider class="mt-2 mb-2"></v-divider>
    <v-list-item-subtitle class="shrink ml-3 mr-3 mb-1" v-if="modelValue.title">{{
      modelValue.title }}</v-list-item-subtitle>
    <v-progress-linear :color="chipColor" :model-value="n" :max="modelValue.range[1]" height="20" rounded>
      <template v-slot:default>
        {{ modelValue.value }}/{{ modelValue.range[1] }} {{ modelValue.placeholder }}
      </template>
    </v-progress-linear>
    <v-list-item-subtitle class="shrink ml-3 mr-3 mt-1" v-if="modelValue.description">{{
      modelValue.description }}</v-list-item-subtitle>
  </div>
</template>

<script setup lang="ts">
import { Setting } from '@scrypted/types';
import { computed } from 'vue';
import { chipColor } from '../settings-common';

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
