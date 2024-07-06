<template>
  <template v-if="modelValue.choices?.length <= 6 && !modelValue.combobox">
    <v-label class="shrink">{{
      modelValue.title }}</v-label>
    <v-chip-group v-model="modelValue.value" column :variant="dark ? 'flat' : undefined"
      :multiple="modelValue.multiple">
      <v-chip v-for="choice of modelValue.choices" class="ma-0 chip-group-round" :rounded="0"
        color="deep-purple-accent-4" size="small" :value="choice"
        :prepend-icon="(modelValue.value as any)?.includes(choice) ? getFaPrefix('fa-circle-check') : getFaPrefix('fa-circle')">
        {{
          choice }}</v-chip>
    </v-chip-group>
    <v-divider></v-divider>
    <div class="mb-2 ml-3 mr-3">
      <v-list-item-subtitle class="shrink" v-if="modelValue.description">{{
        modelValue.description }}</v-list-item-subtitle>
    </div>
  </template>
  <component v-else :is="component" class="shrink" :readonly="modelValue.readonly" density="compact" variant="outlined"
    :label="modelValue.title" :hint="modelValue.description" v-model="modelValue.value" :items="modelValue.choices"
    :multiple="modelValue.multiple" :chips="modelValue.multiple" :closable-chips="modelValue.multiple"
    :persistent-hint="!!modelValue.description" :hide-details="!modelValue.description" persistent-placeholder>
  </component>
</template>
<script setup lang="ts">
import { isDark } from '@/common/colors';
import { getFaPrefix } from '@/device-icons';
import { Setting } from '@scrypted/types';
import { computed } from 'vue';
import { VCombobox, VSelect } from 'vuetify/components';

const dark = isDark();

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
