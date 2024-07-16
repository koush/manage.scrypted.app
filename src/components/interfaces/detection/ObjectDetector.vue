<template>
  <DetectedSVG :detected="detected"></DetectedSVG>
</template>
<script setup lang="ts">
import { getDeviceFromId, registerListener } from '@/id-device';
import { ObjectDetector, ObjectsDetected, ScryptedInterface } from '@scrypted/types';
import { ref, watch } from 'vue';
import DetectedSVG from './DetectedSVG.vue';
const props = defineProps<{
  id: string;
}>();
const device = getDeviceFromId<ObjectDetector>(() => props.id);
const detected = ref<ObjectsDetected>();

registerListener(device, {
  event: ScryptedInterface.ObjectDetector,
}, (source, details, data) => {
  detected.value = data;
});

watch(() => props.id, () => detected.value = undefined);
</script>
