<template>
  <v-col :class="isTouchPhone ? 'pa-0' : undefined">
    <slot name="default"></slot>
  </v-col>
</template>
<script setup lang="ts">
import { isTouchPhone } from '@/common/size';
</script>
