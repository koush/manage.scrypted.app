<template>
  <RadioPanelSetting v-if="modelValue.type === 'radiopanel'" :model-value="modelValue"></RadioPanelSetting>
  <RadioButtonSetting v-else-if="modelValue.type === 'radiobutton'" :model-value="modelValue"></RadioButtonSetting>
  <ReadonlyRangeSetting v-else-if="modelValue.type === 'number' && modelValue.readonly && modelValue.range" :model-value="modelValue"></ReadonlyRangeSetting>
  <ChoiceStringSetting v-else-if="modelValue.choices" :model-value="modelValue"></ChoiceStringSetting>
  <MultipleStringSetting v-else-if="isStringType(modelValue.type) && modelValue.multiple" :model-value="modelValue"></MultipleStringSetting>
  <StringSetting v-else-if="isStringType(modelValue.type)" :model-value="modelValue"></StringSetting>
  <BooleanSetting v-else-if="modelValue.type === 'boolean'" :model-value="modelValue"></BooleanSetting>
  <ButtonSetting v-else-if="modelValue.type === 'button'" :model-value="modelValue"
    @click-button-setting="emits('click-button-setting')"></ButtonSetting>
  <ClipPathSetting v-else-if="modelValue.type === 'clippath'" :model-value="modelValue"
    @click-button-setting="emits('click-button-setting')"></ClipPathSetting>
  <DeviceSetting v-else-if="modelValue.type === 'device'" :model-value="modelValue"></DeviceSetting>
  <DeviceInterfaceSetting v-else-if="modelValue.type === 'interface'" :model-value="modelValue">
  </DeviceInterfaceSetting>
  <Suspense v-else-if="modelValue.type === 'script'">
    <ScriptSetting :model-value="modelValue"></ScriptSetting>
  </Suspense>
  <DateTimeSetting v-else-if="isDateOrTimeType(modelValue.type)" :model-value="modelValue"></DateTimeSetting>
  <DaySetting v-else-if="modelValue.type === 'day'" :model-value="modelValue"></DaySetting>
  <HtmlSetting v-else-if="modelValue.type === 'html'" :model-value="modelValue"></HtmlSetting>
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
import ScriptSetting from './ScriptSetting.vue';
import DaySetting from './DaySetting.vue';
import HtmlSetting from './HtmlSetting.vue';
import DeviceInterfaceSetting from './DeviceInterfaceSetting.vue';
import ReadonlyRangeSetting from './ReadonlyRangeSetting.vue';
import MultipleStringSetting from './MultipleStringSetting.vue';
import RadioPanelSetting from './RadioPanelSetting.vue';
import RadioButtonSetting from './RadioButtonSetting.vue';

const modelValue = defineModel<Setting>();
watchModelValue(modelValue);

const emits = defineEmits<{
  (event: 'click-button-setting'): void;
}>();

function isStringType(type: typeof modelValue.value.type) {
  switch (type) {
    case undefined:
    case null:
    case 'string':
    case 'number':
    case 'integer':
    case 'password':
    case 'textarea':
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
