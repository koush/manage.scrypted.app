<template>
  <ChoiceStringSetting v-model="computedModelValue" force-chips force-group></ChoiceStringSetting>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';
import { ref, watch } from 'vue';
import ChoiceStringSetting from './ChoiceStringSetting.vue';
import { normalizeNumber } from './setting-modelvalue';

const modelValue = defineModel<Setting>();
const numberToDay = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

const dayToNumber = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const computedModelValue = ref<Setting>();

function refreshComputedModelValue() {
  let value: string | string[];
  if (!modelValue.value.multiple) {
    const day = normalizeNumber(modelValue.value.value);
    value = numberToDay[day];
  }
  else {
    let days: number[] = modelValue.value.value as number[];
    if (!Array.isArray(days))
      days = undefined;
    else
      days = [...new Set(days)];
    value = days?.map(day => {
      day = normalizeNumber(day);
      return numberToDay[day];
    })
      .filter(d => !!d);
  }

  computedModelValue.value = {
    ...modelValue.value,
    value,
    choices: numberToDay,
  };
}

watch(() => modelValue.value, refreshComputedModelValue);
refreshComputedModelValue();

watch(() => computedModelValue.value?.value, () => {
  if (modelValue.value.multiple) {
    const days = (computedModelValue.value.value as string[])?.map(day => dayToNumber[day as keyof typeof dayToNumber]);
    modelValue.value.value = days;
  }
  else {
    const day = dayToNumber[computedModelValue.value.value as keyof typeof dayToNumber];
    modelValue.value.value = day;
  }
});


</script>
