<template>
    <div>
        <v-list-item-subtitle class="shrink ml-3 mr-3" v-if="modelValue.title">{{ modelValue.title }}</v-list-item-subtitle>
    <div v-html="modelValue.value"></div>
</div>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';

const modelValue = defineModel<Setting>();
</script>
<style scoped>
.shrink {
  transform: scale(.75, .75);
  width: 120%;
  transform-origin: 0% 50%;
}
</style>