<template>
  <component :is="component" class="shrink" :readonly="modelValue.readonly" density="compact" variant="outlined"
    :label="modelValue.title" :hint="modelValue.description" v-model="modelValue.value" :items="modelValue.choices"
    :multiple="modelValue.multiple" :chips="modelValue.multiple" :closable-chips="modelValue.multiple"
    :persistent-hint="!!modelValue.description" :hide-details="!modelValue.description"></component>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';
import { computed } from 'vue';
import { VCombobox, VSelect } from 'vuetify/components';

const modelValue = defineModel<Setting>();

const component = computed(() => {
  if (!modelValue.value?.combobox)
    return VSelect;
  return VCombobox;
})

</script>
<style scoped>
.shrink {
  transform: scale(.75, .75);
  width: 133.3333%;
  transform-origin: 0% 50%;
}
</style>
