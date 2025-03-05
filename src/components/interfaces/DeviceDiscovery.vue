<template>
  <v-card-subtitle class="mt-8">
    {{ description }}s
  </v-card-subtitle>
  <v-dialog max-width="500" v-model="dialog">
    <DeviceCreatorInterface :id="id" :discovered-device="discoveredDevice" :title="discoveredDevice?.name"
      @created="dialog = false" @click:cancel="dialog = false">
    </DeviceCreatorInterface>
  </v-dialog>

  <v-table density="compact" hover>
    <thead>
      <tr>
        <th style="width: 32px;"></th>
        <th class="text-left">
          Name
        </th>
        <th class="text-left" v-if="mdAndUp && showModel">Model</th>
        <th class="text-left" v-if="mdAndUp && showIp">IP</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="device in discoveredDevices" :key="device.nativeId" style="cursor: pointer;">
        <td><v-icon size="x-small">{{ typeToIcon(device.type) }}</v-icon></td>
        <td><v-btn @click="adoptDevice(device)" size="small" variant="text"
            :prepend-icon="getFaPrefix('fa-circle-plus')">{{ device.name }}</v-btn></td>
        <td v-if="mdAndUp && showModel">{{ device.info?.model }}</td>
        <td v-if="mdAndUp && showIp">{{ device.info?.ip }}</td>
      </tr>
    </tbody>
  </v-table>

</template>

<script setup lang="ts">
import { getFaPrefix, typeToIcon } from '@/device-icons';
import { getDeviceFromId } from '@/id-device';
import { DeviceDiscovery, DeviceProvider, DiscoveredDevice, ScryptedSystemDevice } from '@scrypted/types';
import { computed, ref } from 'vue';
import { useDisplay } from 'vuetify';
import DeviceCreatorInterface from './DeviceCreator.vue';

const { mdAndUp } = useDisplay();
const dialog = ref(false);
const discoveredDevice = ref<DiscoveredDevice>();

const props = defineProps<{
  id: string;
  discoveredDevices: DiscoveredDevice[];
}>();

const device = getDeviceFromId<DeviceProvider & DeviceDiscovery & ScryptedSystemDevice>(() => props.id);

const showModel = computed(() => {
  return props.discoveredDevices.some(d => d.info?.model);
});

const showIp = computed(() => {
  return props.discoveredDevices.some(d => d.info?.ip);
});

const description = computed(() => {
  return device.value?.systemDevice?.deviceDiscovery || "device";
});

async function adoptDevice(d: DiscoveredDevice) {
  discoveredDevice.value = d;
  dialog.value = true;
}
</script>
