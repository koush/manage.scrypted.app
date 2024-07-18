<template>
    <v-card-subtitle>
      These things were discovered by {{ device.name }}.
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
            <tr v-for="device in discoveredDevices" :key="device.nativeId"
                style="cursor: pointer;">
                <td><v-icon size="x-small">{{ typeToIcon(device.type) }}</v-icon></td>
                <td>{{ device.name }}</td>
                <td v-if="mdAndUp && showModel">{{ device.info?.model }}</td>
                <td v-if="mdAndUp && showIp">{{ device.info?.ip }}</td>
            </tr>
        </tbody>
    </v-table>

</template>

<script setup lang="ts">
import { typeToIcon } from '@/device-icons';
import { getDeviceFromId } from '@/id-device';
import { DeviceProvider, DiscoveredDevice } from '@scrypted/types';
import { computed } from 'vue';
import { useDisplay } from 'vuetify';

const { mdAndUp } = useDisplay()

const props = defineProps<{
    id: string;
    discoveredDevices: DiscoveredDevice[];
}>();

const device = getDeviceFromId<DeviceProvider>(() => props.id);

const showModel = computed(() => {
  return props.discoveredDevices.some(d => d.info?.model);
});

const showIp = computed(() => {
  return props.discoveredDevices.some(d => d.info?.ip);
});

</script>