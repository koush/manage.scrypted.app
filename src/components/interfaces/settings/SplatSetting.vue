<template>
  <ChoiceString v-if="modelValue.choices" :model-value="modelValue"></ChoiceString>
  <StringSetting v-else-if="isStringType(modelValue.type)" :model-value="modelValue"></StringSetting>
  <BooleanSetting v-else-if="modelValue.type === 'boolean'" :model-value="modelValue"></BooleanSetting>
  <ButtonSetting v-else-if="modelValue.type === 'button'" :model-value="modelValue"></ButtonSetting>
  <ClipPathSetting v-else-if="modelValue.type === 'clippath'" :model-value="modelValue"></ClipPathSetting>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';
import BooleanSetting from './BooleanSetting.vue';
import ButtonSetting from './ButtonSetting.vue';
import ChoiceString from './ChoiceString.vue';
import ClipPathSetting from './ClipPathSetting.vue';
import StringSetting from './StringSetting.vue';
import { watchModelValue } from './setting-modelvalue';

const modelValue = defineModel<Setting>();
watchModelValue(modelValue);

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
