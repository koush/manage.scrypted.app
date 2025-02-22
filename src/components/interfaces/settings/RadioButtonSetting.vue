<template>
  <v-radio-group v-model="modelValue.value" color="info" inline style="scale: .75;">
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
