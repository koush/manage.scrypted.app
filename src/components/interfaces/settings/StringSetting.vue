<template>
  <v-text-field class="shrink" :readonly="modelValue.readonly" density="compact" variant="outlined"
    :label="modelValue.title" persistent-placeholder :hint="modelValue.description" v-model="modelValue.value"
    :type="modelValue.type === 'password' ? 'password' : undefined" :persistent-hint="!!modelValue.description"
    :hide-details="!modelValue.description"></v-text-field>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';

const modelValue = defineModel<Setting>();

</script>
<style scoped>
.shrink {
  transform: scale(.8, .8);
  width: 125%;
  transform-origin: 0% 50%;
}
</style>
