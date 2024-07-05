<template>
  <v-text-field class="shrink" :readonly="modelValue.readonly" density="compact" variant="outlined" :label="modelValue.title"
    persistent-placeholder :hint="modelValue.description" v-model="modelValue.value"
    :type="modelValue.type === 'password' ? 'password' : undefined"
    :persistent-hint="!!modelValue.description"></v-text-field>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';

const modelValue = defineModel<Setting>();

</script>
<style scoped>
.shrink {
  transform: scale(.75, .75);
  width: 133.3333%;
  transform-origin: 0% 50%;
}
  /* :deep(.v-input),
  :deep(.v-field) {
    font-size: .75rem;
  }
  :deep(.v-label.v-field-label) {
    font-size: .55rem;
  } */
</style>