<template>
  <v-select :readonly="modelValue.readonly" density="compact" variant="outlined" :label="modelValue.title" :hint="modelValue.description"
    v-model="modelValue.value" :items="modelValue.choices" :multiple="modelValue.multiple" chips :closable-chips="modelValue.multiple"
    :persistent-hint="!!modelValue.description"></v-select>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';
import { watch } from 'vue';

const modelValue = defineModel<Setting>();
</script>
