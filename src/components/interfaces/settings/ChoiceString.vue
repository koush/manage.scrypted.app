<template>
  <template v-if="modelValue.choices?.length <= 3 && !modelValue.combobox">
    <template v-if="true || modelValue.multiple">
      <v-divider></v-divider>
      <v-label style="font-size: .65rem;" class="ml-3">{{
        modelValue.title }}</v-label>
      <v-chip-group class="ml-3" v-model="modelValue.value" column :variant="chipVariant" :multiple="modelValue.multiple">
        <v-chip v-for="choice of modelValue.choices" class="chip-group-round" color="light-blue-darken-3" size="x-small"
          :value="choice"
          :prepend-icon="(modelValue.value as any)?.includes(choice) ? getFaPrefix('fa-circle-check') : getFaPrefix('fa-circle')">
          {{
            choice }}</v-chip>
      </v-chip-group>
      <div class="mb-2 ml-3 mr-3">
        <v-list-item-subtitle class="shrink" v-if="modelValue.description">{{
          modelValue.description }}</v-list-item-subtitle>
      </div>
    </template>
    <template v-else>
      <v-divider></v-divider>
      <v-radio-group class="shrink" density="compact" v-model="modelValue.value" inline :label="modelValue.title"
        :hint="modelValue.description" :persistent-hint="!!modelValue.description"
        :hide-details="!modelValue.description">
        <v-radio v-for="choice of modelValue.choices" :color="chipColor" :value="choice" :label="choice"></v-radio>
      </v-radio-group>
    </template>
  </template>
  <component v-else :is="component" class="shrink" :readonly="modelValue.readonly" density="compact" variant="outlined"
    :label="modelValue.title" :hint="modelValue.description" v-model="modelValue.value" :items="modelValue.choices"
    :multiple="modelValue.multiple" :chips="modelValue.multiple" :closable-chips="modelValue.multiple"
    :persistent-hint="!!modelValue.description" :hide-details="!modelValue.description" persistent-placeholder>
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
import { getChipVariant } from '../settings-chip';

const chipColor = "light-blue-darken-3";
const chipVariant = getChipVariant();

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

/*
.chip-group-round:first-child {
  border-radius: 16px 0px 0px 16px !important;
}

.chip-group-round:last-child {
  border-radius: 0px 16px 16px 0px !important;
} */
</style>
