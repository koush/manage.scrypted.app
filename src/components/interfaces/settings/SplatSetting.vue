<template>
  <ChoiceStringSetting v-if="modelValue.choices" :model-value="modelValue"></ChoiceStringSetting>
  <StringSetting v-else-if="isStringType(modelValue.type)" :model-value="modelValue"></StringSetting>
  <BooleanSetting v-else-if="modelValue.type === 'boolean'" :model-value="modelValue"></BooleanSetting>
  <ButtonSetting v-else-if="modelValue.type === 'button'" :model-value="modelValue"></ButtonSetting>
  <ClipPathSetting v-else-if="modelValue.type === 'clippath'" :model-value="modelValue"></ClipPathSetting>
  <DeviceSetting v-else-if="modelValue.type === 'device'" :model-value="modelValue"></DeviceSetting>
  <DateTimeSetting v-else-if="isDateOrTimeType(modelValue.type)" :model-value="modelValue"></DateTimeSetting>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';
import BooleanSetting from './BooleanSetting.vue';
import ButtonSetting from './ButtonSetting.vue';
import ChoiceStringSetting from './ChoiceStringSetting.vue';
import ClipPathSetting from './ClipPathSetting.vue';
import StringSetting from './StringSetting.vue';
import { watchModelValue } from './setting-modelvalue';
import DeviceSetting from './DeviceSetting.vue';
import DateTimeSetting from './DateTimeSetting.vue';

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

function isDateOrTimeType(type: typeof modelValue.value.type) {
  switch (type) {
    case 'date':
    case 'time':
    case 'datetime':
      return true;
  }
  return false;
}
</script>
