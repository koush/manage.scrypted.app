<template>
  <v-text-field v-for="(value, index) in strings" class="shrink" :readonly="modelValue.readonly" density="compact"
    variant="outlined" :label="modelValue.title" persistent-placeholder :hint="modelValue.description"
    :model-value="value" @update:model-value="v => strings[index] = v"
    :type="modelValue.type === 'password' ? 'password' : undefined" :persistent-hint="!!modelValue.description"
    :hide-details="!modelValue.description"></v-text-field>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';
import { ref, watch } from 'vue';

const modelValue = defineModel<Setting>();

const strings = ref<string[]>();

function updateStrings() {
  let value = modelValue.value.value as string[];
  if (!value)
    value = [];
  value = value.slice();
  const hasEmpty = value.find(v => !v);
  if (!hasEmpty)
    value.push('');
  strings.value = value;
}

watch(() => modelValue.value.value, updateStrings, { immediate: true });
updateStrings();
watch(() => strings.value, () => {
  const mv = (modelValue.value.value as string[]).filter(v => v);
  const nv = strings.value.filter(v => v);
  if (JSON.stringify(mv) === JSON.stringify(nv))
    return;
  modelValue.value.value = nv;
}, {
  deep: true,
});

</script>
<style scoped>
.shrink {
  transform: scale(.8, .8);
  width: 125%;
  transform-origin: 0% 50%;
}
</style>
