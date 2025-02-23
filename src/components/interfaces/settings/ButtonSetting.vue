<template>
  <div>
    <v-btn :readonly="modelValue.readonly" density="compact" variant="tonal" block @click="emits('click-button-setting')" :disabled="disabled">{{ modelValue.title }}</v-btn>
    <v-list-item-subtitle class="shrink ml-3 mr-3" v-if="description">{{
      description }}</v-list-item-subtitle>
  </div>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';
import { computed } from 'vue';

const modelValue = defineModel<Setting>();

const emits = defineEmits<{
  (event: 'click-button-setting'): void;
}>();

const props = defineProps<{
  disabled?: boolean;
  hideTitle?: boolean;
}>();

const description = computed(() => {
  if (props.hideTitle)
    return undefined;
  return modelValue.value.description;
});

</script>
<style scoped>
.shrink {
  transform: scale(.75, .75);
  width: 120%;
  transform-origin: 0% 50%;
}
</style>
