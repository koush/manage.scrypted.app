<template>
  <div @click="onClick">
    <div style="position: relative; width: 100%; height: 100%;">
      <svg style="position: absolute;" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none">
        <polygon :points="modelValue?.points.map(p => p[0] + ',' + p[1]).join(' ')" :fill="zoneColor"
          style="opacity: 50%" />
      </svg>
      <svg style="position: absolute;" width="100%" height="100%">
        <circle v-for="p in modelValue?.points" :cx="`${p[0] * 100}%`" :cy="`${p[1] * 100}%`" r="5" :fill="zoneColor" />
      </svg>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { ClipPathModel } from '../clip-path-model';

const modelValue = defineModel<ClipPathModel>();

const zoneColor = computed(() => {
  return modelValue.value?.color || 'red';
});

function onClick(e: MouseEvent) {
  if (!modelValue.value)
    modelValue.value = { points: [] };

  const div = e.currentTarget as HTMLDivElement;
  modelValue.value.points.push([e.offsetX / div.offsetWidth, e.offsetY / div.offsetHeight]);
  modelValue.value.dimensions = [div.offsetWidth, div.offsetHeight];
}
</script>
