<template>
  <v-card>
    <template v-slot:title>
      <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
        Object Detection
      </v-card-subtitle>
    </template>

    <div style="display: flex; justify-content: center; position: relative; cursor: pointer;"
      @dragover="e => e.preventDefault()" @drop="onDrop" :style="imgSrc ? undefined : {
        aspectRatio: '16/9',
      }" @click="detectFile.click()">
      <template v-if="imgSrc">
        <img  :src="imgSrc" style="object-fit: contain; width: 100%;">
        <DetectedSVG :detected="detected" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></DetectedSVG>
      </template>
      <v-card-subtitle v-else style="align-content: center;">Drag and drop an image to detect objects.</v-card-subtitle>
      <input type="file" ref="detectFile" style="display: none;" @change="detectInput" accept=".jpg, .png, .jpeg" />
    </div>
  </v-card>
</template>
<script setup lang="ts">
import { connectedClient, connectPluginClient } from '@/common/client';
import { getDeviceFromId } from '@/id-device';
import { ObjectDetection, ObjectsDetected } from '@scrypted/types';
import { ref } from 'vue';
import DetectedSVG from './DetectedSVG.vue';

const props = defineProps<{
  id: string;
}>();

const device = getDeviceFromId<ObjectDetection>(() => props.id);
const imgSrc = ref<string>();

const detected = ref<ObjectsDetected>();
const detectFile = ref<HTMLInputElement>();

async function detectFileBlob(file: File) {
  imgSrc.value = URL.createObjectURL(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const {mediaManager} = connectedClient.value || await connectPluginClient();
  const mo = await mediaManager.createMediaObject(buffer, 'image/*');
  detected.value = await device.value.detectObjects(mo);
  console.log(detected.value);
}

async function onDrop(ev: DragEvent) {
  ev.preventDefault()
  const file = ev.dataTransfer.files[0];
  await detectFileBlob(file);
}

async function detectInput() {
  const file = detectFile.value.files[0];
  await detectFileBlob(file);
}
</script>
