<template>
  <div @click="onClick">
    <div style="position: relative; width: 100%; height: 100%;">
      <svg style="position: absolute;" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none">
        <polygon :points="modelValue?.points.map(p => applyScale(p[0]) + ',' + applyScale(p[1])).join(' ')"
          :fill="zoneColor" style="opacity: 50%" />
      </svg>
      <svg style="position: absolute;" width="100%" height="100%">
        <circle v-for="p in modelValue?.points" :cx="`${applyScale(p[0]) * 100}%`" :cy="`${applyScale(p[1]) * 100}%`"
          r="5" :fill="zoneColor" />
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

const props = defineProps<{
  scale?: number;
}>();

const scale = computed(() => props.scale || 1);
const zeroPoint = computed(() => {
  if (!props.scale)
    return 0;
  return (1 - props.scale) / 2;
});

function applyScale(p: number) {
  return zeroPoint.value + p * scale.value;
}

function applyScaleInverse(p: number) {
  return (p - zeroPoint.value) / scale.value;
}

function onClick(e: MouseEvent) {
  if (!modelValue.value)
    modelValue.value = { points: [] };

  const div = e.currentTarget as HTMLDivElement;
  modelValue.value.points.push([applyScaleInverse(e.offsetX / div.offsetWidth), applyScaleInverse(e.offsetY / div.offsetHeight)]);
  modelValue.value.dimensions = [div.offsetWidth, div.offsetHeight];
}
</script>
