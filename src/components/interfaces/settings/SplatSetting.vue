<template>
  <template>
    <ChoiceString v-if="modelValue.choices" :model-value="modelValue"></ChoiceString>
    <StringSetting v-else-if="isStringType(modelValue.type)" :model-value="modelValue"></StringSetting>
    <BooleanSetting v-else-if="modelValue.type === 'boolean'" :model-value="modelValue"></BooleanSetting>
    <ButtonSetting v-else-if="modelValue.type === 'button'" :model-value="modelValue"></ButtonSetting>
  </template>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';

const modelValue = defineModel<Setting>();

function isStringType(type: typeof modelValue.value.type) {
  switch (type) {
    case undefined:
    case null:
    case 'string':
    case 'number':
    case 'integer':
    case 'password':
      return true;
  }
  return false;
}

</script>
