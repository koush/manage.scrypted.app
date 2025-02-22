<template>
  <v-radio-group v-model="modelValue.value" inline style="scale: .75; transform-origin: 0; margin-bottom: -16px;" color="info" :label="modelValue.title" >
    <v-radio v-for="choice of modelValue.choices" :key="choice" :value="choice" :label="choice">
    </v-radio>
  </v-radio-group>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';

const modelValue = defineModel<Setting>();
defineProps<{
  forceChips?: boolean;
  forceGroup?: boolean;
}>();
</script>
