<template>
  <div>
    <template
      v-if="(forceChips || modelValue.choices?.length <= 3) && !modelValue.combobox && !modelValue.immediate && !modelValue.readonly">
      <v-list-item-subtitle class="shrink mt-1 ml-3" v-if="modelValue.title && !hideTitle">{{
        modelValue.title }}</v-list-item-subtitle>
      <v-btn-toggle v-model="modelValue.value" column :multiple="modelValue.multiple" density="compact" variant="tonal"
        style="height: 32px" :mandatory="!modelValue.multiple">
        <v-btn v-for="(choice, index) of modelValue.choices" :disabled="disabled"
          :rounded="!modelValue.multiple || forceGroup ? 0 : undefined" :color="chipColor" size="x-small"
          :value="choice"
          :prepend-icon="(modelValue.value as any)?.includes(choice) ? getFaPrefix('fa-square-check') : getFaPrefix('fa-square')"
          :append-icon="maybeGetFaPrefix(modelValue.icons?.[index])">
          {{
            choice }}</v-btn>
      </v-btn-toggle>
      <div class="mb-2 mr-3">
        <v-list-item-subtitle class="shrink ml-3 mr-3" v-if="description">{{
          description }}</v-list-item-subtitle>
      </div>
      <v-divider class="mt-2 mb-2"></v-divider>
    </template>
    <component v-else :is="component" class="shrink" :readonly="modelValue.readonly" density="compact"
      variant="outlined" :label="hideTitle ? undefined : modelValue.title" :hint="description"
      v-model="modelValue.value" :items="modelValue.choices" :multiple="modelValue.multiple"
      :chips="modelValue.multiple" :closable-chips="modelValue.multiple && !modelValue.readonly"
      :persistent-hint="!!description" :hide-details="!description" persistent-placeholder :disabled="disabled">
      <template v-if="modelValue.multiple" v-slot:chip="{ props, index }">
        <v-chip v-bind="props" :color="chipColor" :variant="chipVariant"
          :prepend-icon="iconForChoice(index)"></v-chip>
      </template>
      <template v-if="modelValue.icons" v-slot:item="{ props, index }">
        <v-list-item v-bind="props" density="compact" color="info">
          <template v-slot:prepend>
            <v-icon size="x-small">{{ maybeGetFaPrefix(modelValue.icons?.[index]) }}</v-icon>
          </template>
        </v-list-item>
      </template>
    </component>
  </div>
</template>
<script setup lang="ts">
import { getFaPrefix } from '@/device-icons';
import { Setting } from '@scrypted/types';
import { computed } from 'vue';
import { VCombobox, VSelect } from 'vuetify/components';
import { chipColor, getChipVariant } from '../settings-common';
import { maybeGetFaPrefix } from '@/common/fa-prefix';

const chipVariant = getChipVariant();

const modelValue = defineModel<Setting>();
const props = defineProps<{
  forceChips?: boolean;
  forceGroup?: boolean;
  disabled?: boolean;
  hideTitle?: boolean;
}>();

function iconForChoice(valueIndex: number) {
  if (!modelValue.value.icons)
    return undefined;
  const choice = (modelValue.value.value as string[])?.[valueIndex];
  const index = modelValue.value.choices.indexOf(choice);
  return modelValue.value.icons[index];
}

const description = computed(() => {
  if (props.hideTitle)
    return undefined;
  return modelValue.value.description;
});

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
