<template>
  <template v-if="(forceChips || modelValue.choices?.length <= 3) && !modelValue.combobox && !modelValue.immediate && !modelValue.readonly">
    <v-divider></v-divider>
    <v-list-item-subtitle class="shrink mt-1 ml-3" v-if="modelValue.title">{{
      modelValue.title }}</v-list-item-subtitle>
    <v-chip-group v-model="modelValue.value" column :variant="chipVariant" :multiple="modelValue.multiple">
      <v-chip v-for="choice of modelValue.choices"
        :class="!modelValue.multiple || forceGroup ? 'chip-group-round ma-0' : undefined"
        :rounded="!modelValue.multiple || forceGroup ? 0 : undefined" :color="chipColor" size="small" :value="choice"
        :prepend-icon="(modelValue.value as any)?.includes(choice) ? getFaPrefix('fa-circle-check') : getFaPrefix('fa-circle')">
        {{
          choice }}</v-chip>
    </v-chip-group>
    <div class="mb-2 mr-3">
      <v-list-item-subtitle class="shrink ml-3 mr-3" v-if="modelValue.description">{{
        modelValue.description }}</v-list-item-subtitle>
    </div>
    <v-divider></v-divider>
  </template>
  <component v-else :is="component" class="shrink" :readonly="modelValue.readonly" density="compact" variant="outlined"
    :label="modelValue.title" :hint="modelValue.description" v-model="modelValue.value" :items="modelValue.choices"
    :multiple="modelValue.multiple" :chips="modelValue.multiple"
    :closable-chips="modelValue.multiple && !modelValue.readonly" :persistent-hint="!!modelValue.description"
    :hide-details="!modelValue.description" persistent-placeholder>
    <template v-if="modelValue.multiple" v-slot:chip="{ props }">
      <v-chip v-bind="props" :color="chipColor" :variant="chipVariant"></v-chip>
    </template>
  </component>
</template>
<script setup lang="ts">
import { getFaPrefix } from '@/device-icons';
import { Setting } from '@scrypted/types';
import { computed } from 'vue';
import { VCombobox, VSelect } from 'vuetify/components';
import { chipColor, getChipVariant } from '../settings-common';

const chipVariant = getChipVariant();

const modelValue = defineModel<Setting>();
defineProps<{
  forceChips?: boolean;
  forceGroup?: boolean;
}>();

const component = computed(() => {
  if (!modelValue.value?.combobox)
    return VSelect;
  return VCombobox;
});

</script>
<style scoped>
.shrink {
  transform: scale(.8, .8);
  width: 125%;
  transform-origin: 0% 50%;
}

.chip-group-round:first-child {
  border-radius: 16px 0px 0px 16px !important;
}

.chip-group-round:last-child {
  border-radius: 0px 16px 16px 0px !important;
}
</style>
