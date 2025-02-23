<template>
  <div>
    <v-text-field v-if="modelValue.type !== 'textarea'" class="shrink" :readonly="modelValue.readonly" density="compact"
      variant="outlined" :label="title" persistent-placeholder :hint="description"
      :placeholder="modelValue?.placeholder" v-model="modelValue.value"
      :type="modelValue.type === 'password' ? 'password' : undefined" :persistent-hint="!!description"
      :hide-details="!description" :disabled="disabled"></v-text-field>
    <v-textarea v-else class="shrink" :readonly="modelValue.readonly" density="compact" variant="outlined"
      :label="title" persistent-placeholder :hint="description"
      :placeholder="modelValue?.placeholder" v-model="modelValue.value" :persistent-hint="!!description"
      :hide-details="!description" :disabled="disabled"></v-textarea>
  </div>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';
import { computed } from 'vue';

const modelValue = defineModel<Setting>();

const props = defineProps<{
  disabled?: boolean;
  hideTitle?: boolean;
}>();

const title = computed(() => {
  if (props.hideTitle)
    return undefined;
  return modelValue.value.title;
});

const description = computed(() => {
  if (props.hideTitle)
    return undefined;
  return modelValue.value.description;
});

</script>
<style scoped>
.shrink {
  transform: scale(.8, .8);
  width: 125%;
  transform-origin: 0% 50%;
}
</style>
