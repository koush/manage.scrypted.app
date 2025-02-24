<template>
  <div style="display: flex; flex-direction: column; align-items: center;">
    <v-list-item-subtitle class="mt-1 mb-1" v-if="!hideTitle">
      {{ modelValue.title }}
    </v-list-item-subtitle>
    <v-btn-toggle v-model="modelValue.value" mandatory class="mb-4 rounded-md" divided
      style="width: 100%; max-width: 360px; border-width: 2px;" color="info" density="compact">
      <v-btn v-for="(choice, index) of modelValue.choices" :key="choice" :value="choice" size="x-small" :height="32"
        style="flex: 1;" :prepend-icon="maybeGetFaPrefix(modelValue.icons?.[index])">
        {{ choice }}
      </v-btn>
    </v-btn-toggle>
  </div>
</template>
<script setup lang="ts">
import { maybeGetFaPrefix } from '../../../common/fa-prefix';
import { Setting } from '@scrypted/types';

const modelValue = defineModel<Setting>();
defineProps<{
  hideTitle?: boolean;
}>();
</script>
