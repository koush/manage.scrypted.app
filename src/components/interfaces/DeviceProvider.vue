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
    <v-table density="compact">
      <thead>
        <tr>
          <th style="width: 0;"></th>
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
import { getFaPrefix, typeToIcon } from '@/device-icons';
import { getDeviceFromRoute, goDevice } from '@/id-device';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';

const router = useRouter();
const { mdAndUp } = useDisplay()

const { id, device } = getDeviceFromRoute();

const childDevices = computed(() => {
  return getAllDevices()
    .filter(d => d.providerId === id.value && d.id !== id.value);
});

const showModel = computed(() => {
  return childDevices.value.some(d => d.info?.model);
});

const showIp = computed(() => {
  return childDevices.value.some(d => d.info?.ip);
});

</script>
