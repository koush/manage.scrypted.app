<template>
  <v-card-subtitle class="mt-8">
    {{ description }}s
  </v-card-subtitle>
  <v-dialog max-width="500" v-model="dialog">
    <DeviceCreatorInterface :id="id" :discovered-device="discoveredDevice" :title="discoveredDevice?.name"
      @created="dialog = false" @click:cancel="dialog = false">
    </DeviceCreatorInterface>
  </v-dialog>

  <DevicePagination :devices="discoveredDevices" :device-groups="deviceGroups"
    @click:device="device => adoptDevice(device as DiscoveredDevice)" hide-plugin-column></DevicePagination>
</template>

<script setup lang="ts">
import { getDeviceFromId } from '@/id-device';
import { DeviceDiscovery, DeviceProvider, DiscoveredDevice, ScryptedSystemDevice } from '@scrypted/types';
import { computed, ref } from 'vue';
import DevicePagination from '../DevicePagination.vue';
import { createDeviceGroups } from '../device-pagination';
import DeviceCreatorInterface from './DeviceCreator.vue';

const dialog = ref(false);
const discoveredDevice = ref<DiscoveredDevice>();

const props = defineProps<{
  id: string;
  discoveredDevices: DiscoveredDevice[];
}>();

const device = getDeviceFromId<DeviceProvider & DeviceDiscovery & ScryptedSystemDevice>(() => props.id);

const deviceGroups = createDeviceGroups(() => props.discoveredDevices);

const description = computed(() => {
  return device.value?.systemDevice?.deviceDiscovery || "Discovered Devices";
});

async function adoptDevice(d: DiscoveredDevice) {
  discoveredDevice.value = d;
  dialog.value = true;
}
</script>
