<template>
  <v-switch v-if="modelValue?.immediate" :color="chipColor" inset class="shrink" :readonly="modelValue.readonly"
    density="compact" :label="modelValue.title" persistent-placeholder :hint="modelValue.description"
    v-model="modelValue.value" :persistent-hint="!!modelValue.description"
    :hide-details="!modelValue.description"></v-switch>
  <v-checkbox v-else :color="chipColor" class="shrink" :readonly="modelValue.readonly" density="compact"
    :label="modelValue.title" persistent-placeholder :hint="modelValue.description" v-model="modelValue.value"
    :persistent-hint="!!modelValue.description" :hide-details="!modelValue.description"></v-checkbox>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';
import { chipColor } from '../settings-common';

const modelValue = defineModel<Setting>();

</script>
<style scoped>
.shrink {
  transform: scale(.8, .8);
  width: 125%;
  transform-origin: 0% 50%;
}
</style>
