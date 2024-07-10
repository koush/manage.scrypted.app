<template>
  <v-card>
    <template v-slot:prepend>
      <v-icon size="xx-small">{{ getFaPrefix('fa-database') }}</v-icon>
    </template>
    <template v-slot:title>
      <v-card-subtitle v-if="!hasDeviceCreator" class="pt-1 pl-4" style="text-transform: uppercase;">
        Providing Things
      </v-card-subtitle>
      <template v-else>
        <div style="display: flex; align-items: center">
          <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
            Providing Things
          </v-card-subtitle>
          <v-dialog max-width="500">
            <template v-slot:activator="{ props: activatorProps }">
              <v-btn v-bind="activatorProps" variant="elevated" color="success" class="ml-4" size="small">Add
                {{ title }}</v-btn>
            </template>
            <template v-slot:default="{ isActive }">
              <DeviceCreatorInterface :id="id" @click:cancel="isActive.value = false"
                @click:create="(id, settings) => { isActive.value = false; createDevice(router, id, settings); }">
              </DeviceCreatorInterface>
            </template>
          </v-dialog>
        </div>
      </template>
    </template>
    <v-card-subtitle>
      These things were created by {{ device.name }}.
    </v-card-subtitle>
    <v-table density="compact">
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
        <tr v-for="device in childDevices" :key="device.id" @click="goDevice(router, device)" style="cursor: pointer;">
          <td><v-icon size="x-small">{{ typeToIcon(device.type) }}</v-icon></td>
          <td>{{ device.name }}</td>
          <td v-if="mdAndUp && showModel">{{ device.info?.model }}</td>
          <td v-if="mdAndUp && showIp">{{ device.info?.ip }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>
<script setup lang="ts">
import { getAllDevices } from '@/common/devices';
import { createDevice } from '@/device-creator';
import { getFaPrefix, typeToIcon } from '@/device-icons';
import { getDeviceFromId, goDevice } from '@/id-device';
import { DeviceProvider, ScryptedInterface, ScryptedSystemDevice } from '@scrypted/types';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import DeviceCreatorInterface from './DeviceCreator.vue';

const router = useRouter();
const { mdAndUp } = useDisplay()

const props = defineProps<{
  id: string;
}>();

const device = getDeviceFromId<DeviceProvider & ScryptedSystemDevice>(() => props.id);

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
</script>
