<template>
  <v-list-item-subtitle style="align-self: center;" class="mt-1 mb-1">
    {{ modelValue.title }}
  </v-list-item-subtitle>
  <v-btn-toggle v-model="modelValue.value" mandatory class="mb-4 rounded-md" divided
    style="width: 100%; max-width: 360px; align-self: center; border-width: 1px; height: 32px;" color="info">
    <v-btn v-for="choice of modelValue.choices" :key="choice" :value="choice" size="x-small" :height="32"
      style="flex: 1;">
      {{ choice }}
    </v-btn>
  </v-btn-toggle>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';

const modelValue = defineModel<Setting>();
defineProps<{
  forceChips?: boolean;
  forceGroup?: boolean;
}>();
</script>
