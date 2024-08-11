<template>
  <v-card>
    <template v-slot:prepend>
      <v-icon size="xx-small">{{ getFaPrefix('fa-database') }}</v-icon>
    </template>
    <template v-slot:title>
      <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
        Providing Things
      </v-card-subtitle>
    </template>
    <v-card-subtitle>
      These things were created by {{ device.name }}.
    </v-card-subtitle>
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
        <tr v-for="device in childDevices" :key="device.id">
          <td><v-icon size="x-small">{{ typeToIcon(device.type) }}</v-icon></td>
          <td>
            <v-btn variant="text" size="small" :to="getDeviceRoute(device.id)"> {{ device.name }}</v-btn>
          </td>
          <td v-if="mdAndUp && showModel">{{ device.info?.model }}</td>
          <td v-if="mdAndUp && showIp">{{ device.info?.ip }}</td>
        </tr>
      </tbody>
    </v-table>
    <DeviceDiscoveryInterface v-if="hasDeviceDiscovery && discovered" :id="id" :discovered-devices="discovered">
    </DeviceDiscoveryInterface>
    <v-card-actions v-if="hasDeviceCreator || hasDeviceDiscovery">
      <v-dialog max-width="500" v-if="hasDeviceCreator">
        <template v-slot:activator="{ props: activatorProps }">
          <v-btn v-bind="activatorProps" variant="flat" color="success" class="ml-4" size="small">Add
            {{ title }}</v-btn>
        </template>
        <template v-slot:default="{ isActive }">
          <DeviceCreatorInterface :id="id" @click:cancel="isActive.value = false" @created="isActive.value = false">
          </DeviceCreatorInterface>
        </template>
      </v-dialog>
      <v-btn v-if="hasDeviceDiscovery" variant="outlined" color="info" class="ml-4" size="small"
        @click="discoverDevices">Discover</v-btn>
    </v-card-actions>
  </v-card>
</template>
<script setup lang="ts">
import { getAllDevices } from '@/common/devices';
import { getFaPrefix, typeToIcon } from '@/device-icons';
import { getDeviceFromId, getDeviceRoute, registerListener } from '@/id-device';
import { DeviceDiscovery, DeviceProvider, DiscoveredDevice, ScryptedInterface, ScryptedSystemDevice } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import DeviceCreatorInterface from './DeviceCreator.vue';
import DeviceDiscoveryInterface from './DeviceDiscovery.vue';

const { mdAndUp } = useDisplay()

const props = defineProps<{
  id: string;
}>();

const device = getDeviceFromId<DeviceProvider & DeviceDiscovery & ScryptedSystemDevice>(() => props.id);

const title = computed(() => {
  return device.value?.systemDevice?.deviceCreator || "Device";
});

const childDevices = computed(() => {
  return getAllDevices()
    .filter(d => d.providerId === props.id && d.id !== props.id);
});

const showModel = computed(() => {
  return childDevices.value.some(d => d.info?.model);
});

const showIp = computed(() => {
  return childDevices.value.some(d => d.info?.ip);
});

const hasDeviceCreator = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.DeviceCreator);
});

const hasDeviceDiscovery = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.DeviceDiscovery);
});

const discovered = ref<DiscoveredDevice[]>();
async function discoverDevices() {
  discovered.value = await device.value.discoverDevices(true);
}

watch(() => props.id, () => {
  discovered.value = undefined;
});

registerListener(device, {
  event: ScryptedInterface.DeviceDiscovery,
}, async () => {
  discovered.value = await device.value.discoverDevices();
});

</script>
