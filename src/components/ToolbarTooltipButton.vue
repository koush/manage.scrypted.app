<template>
  <v-btn :icon="forceIcon" class="ma-0" size="small" :color="color"><v-icon>{{ rawIcon ? icon : getFaPrefix(icon) }}</v-icon>
    <v-tooltip activator="parent" location="end">{{ tooltip }}</v-tooltip>
  </v-btn>
</template>
<script setup lang="ts">
import { getFaPrefix } from '@/util/device-icons';

defineProps<{
  forceIcon?: boolean;
  rawIcon?: boolean;
  icon: string;
  tooltip: string;
  color?: string;
}>();
</script>
