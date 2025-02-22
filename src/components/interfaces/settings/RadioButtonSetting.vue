<template>
  <v-btn-toggle v-model="modelValue.value" mandatory class="mb-4 rounded-md" divided
    style="align-self: center; border-width: 1px; height: 32px;" color="info">
    <v-btn v-for="choice of modelValue.choices" :key="choice" :value="choice" size="x-small" :height="32">
      {{ choice }}
    </v-btn>
  </v-btn-toggle>
</template>




<script setup lang="ts">
import { Setting } from '@scrypted/types';


const modelValue = defineModel<Setting>();
defineProps<{
  forceChips?: boolean;
  forceGroup?: boolean;
}>();


</script>
