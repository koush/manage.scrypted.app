<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <template v-slot:prepend>
            <v-icon size="small" :icon="getFaPrefix('fa-microchip')"></v-icon>
          </template>
          <template v-slot:title>
            <div style="display: flex; align-items: center">
              <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">Devices</v-card-subtitle>

              <v-dialog max-width="500" v-model="addDeviceDialog">
                <template v-if="deviceGroups.length > 1" v-slot:activator="{ props: activatorProps }">
                  <v-btn v-bind="activatorProps" variant="flat" color="success" class="ml-4" size="x-small">Add
                    Device</v-btn>
                </template>

                <template v-slot:default="{ isActive }">
                  <DeviceCreatorInterface @click:cancel="isActive.value = false" @created="isActive.value = false">
                  </DeviceCreatorInterface>
                </template>
              </v-dialog>
              <v-btn v-if="deviceGroups.length > 1" size="x-small" class="ml-4" color="info"
                to="/component/plugin/install" variant="outlined">Install Plugin</v-btn>
            </div>
          </template>

          <template v-if="deviceGroups.length <= 1">
            <div
              style="height: 300px; display: flex; text-align: center; flex-direction: column; justify-content: center; align-items: center;">
              <div>Welcome to Scrypted.</div>
              <div>Get started by installing the plugin that supports your hardware. Then add the device below or within the plugin.</div>
              <div style="display: flex;" class="mt-4">
                <v-btn variant="flat" size="x-small" class="ml-4" color="info" to="/component/plugin/install">Install
                  Plugin</v-btn>
                <v-btn variant="flat" color="success" class="ml-4" size="x-small" @click="addDeviceDialog = true">Add
                  Device</v-btn>
              </div>

            </div>
          </template>
          <template v-else>
            <v-chip-group class="ma-4" :model-value="selectedDeviceGroups" multiple column>
              <v-chip v-for="deviceGroup in deviceGroups" :key="deviceGroup"
                :prepend-icon="deviceGroup === other ? typeToIcon(ScryptedDeviceType.Unknown) : typeToIcon(deviceGroup)"
                size="small" :color="isDefaultFilter ? 'deep-purple-accent-4' : 'info'"
                @click="e => clickChip(deviceGroup, e)" variant="flat" :rounded="0" class="pl-3 ma-0"> {{
                  deviceGroup
                }} ({{ devices.filter(d => (hasFixedPhysicalLocation(d.type!) ? d.type : other) ===
                  deviceGroup).length }})</v-chip>
            </v-chip-group>
            <v-text-field v-if="filteredDevices.length > pageSize" v-model="filterText"
              style="transform: scale(.75, .75)" title="Search" label="Search" density="compact"></v-text-field>
            <v-table density="compact">
              <thead>
                <tr>
                  <th style="width: 32px;"></th>
                  <th class="text-left">
                    Name
                  </th>
                  <th class="text-left" v-if="mdAndUp && showModel">Model</th>
                  <th class="text-left" v-if="lgAndUp && showManufacturer">Manufacturer</th>
                  <th class="text-left" v-if="mdAndUp && showIp">IP</th>
                  <th class="text-left" v-if="mdAndUp">
                    Plugin
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="device in devicePage" :key="device.id" @click="goDevice(router, device)"
                  style="cursor: pointer;">
                  <td><v-icon size="x-small">{{ typeToIcon(device.type) }}</v-icon></td>
                  <td style="text-transform: uppercase; font-weight: 500">{{ device.name }}</td>
                  <td v-if="mdAndUp && showModel">{{ device.info?.model }}</td>
                  <td v-if="lgAndUp && showManufacturer">{{ device.info?.manufacturer }}</td>
                  <td v-if="mdAndUp && showIp">{{ device.info?.ip }}</td>
                  <td v-if="mdAndUp"><v-btn color="info" size="small" variant="text" @click.stop
                      :to="`/device/${connectedClient!.systemManager.getDeviceById(device.pluginId).id}`">{{
                        connectedClient!.systemManager.getDeviceById(device.pluginId).name }}</v-btn></td>
                </tr>
              </tbody>
            </v-table>
            <v-pagination :length="devicePages.length" v-model="page" rounded density="compact"></v-pagination>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { connectPluginClient, connectedClient } from '@/common/client';
import { getAllDevices } from '@/common/devices';
import { getFaPrefix, hasFixedPhysicalLocation, typeToIcon } from '@/device-icons';
import { goDevice } from '@/id-device';
import { ScryptedDeviceType, ScryptedInterface } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import DeviceCreatorInterface from './interfaces/DeviceCreator.vue';

const router = useRouter();
const other = 'Other' as ScryptedDeviceType;

const { lgAndUp, mdAndUp } = useDisplay();

const isDefaultFilter = ref(true);

function clickChip(deviceGroup: ScryptedDeviceType, e: MouseEvent | KeyboardEvent) {
  const i = deviceGroups.value.indexOf(deviceGroup);

  if (isDefaultFilter.value) {
    selectedDeviceGroups.value = [];
    isDefaultFilter.value = false;
    selectedDeviceGroups.value = [i];
    return;
  }

  if (selectedDeviceGroups.value.includes(i))
    selectedDeviceGroups.value = selectedDeviceGroups.value.filter(s => s !== i);
  else
    selectedDeviceGroups.value = [...selectedDeviceGroups.value, i];

  if (!selectedDeviceGroups.value.length) {
    isDefaultFilter.value = true;
    resetSelectedDeviceGroups();
  }
}


const devices = computed(() => {
  if (!connectedClient.value) {
    connectPluginClient();
    return [];
  }

  const all = getAllDevices();
  const ret = all.filter(d => {
    if (d.interfaces.includes(ScryptedInterface.ScryptedPlugin) && !hasFixedPhysicalLocation(d.type!))
      return false;
    // if this is this is a sub device ofanother device that has a fixed physical location, don't show it.
    const provider = connectedClient.value?.systemManager.getDeviceById(d.providerId!);
    if (provider.id === d.id) {
      // this is the root plugin device which has a fixed physical location type, so show it
      return true;
    }
    if (!provider?.type)
      return true;
    if (hasFixedPhysicalLocation(provider.type))
      return false;
    return true;
  })
    .sort((a, b) => a.name!.localeCompare(b.name!));
  return ret;
});

const deviceGroups = computed(() => {
  if (!connectedClient.value) {
    connectPluginClient();
    return [];
  }

  const groups = new Set<ScryptedDeviceType>();
  for (const device of devices.value) {
    if (hasFixedPhysicalLocation(device.type!))
      groups.add(device.type!);
  }

  const ret = [...groups];
  ret.sort((a, b) => {
    if (hasFixedPhysicalLocation(a) && !hasFixedPhysicalLocation(b))
      return -1;
    if (!hasFixedPhysicalLocation(a) && hasFixedPhysicalLocation(b))
      return 1;
    return a.localeCompare(b);
  });
  ret.push(other);
  return ret;
});

const selectedDeviceGroups = ref<number[]>([]);

function resetSelectedDeviceGroups() {
  selectedDeviceGroups.value = [];
  for (let i = 0; i < deviceGroups.value.length; i++) {
    const d = deviceGroups.value[i];
    if (d !== other && hasFixedPhysicalLocation(d)) {
      selectedDeviceGroups.value.push(i);
    }
  }
}

resetSelectedDeviceGroups();

watch(() => deviceGroups.value, () => {
  resetSelectedDeviceGroups();
});

const filterText = ref('');

const filteredDevices = computed(() => {
  return devices.value.filter(d => {
    if (!selectedDeviceGroups.value.length)
      return true;
    const group = hasFixedPhysicalLocation(d.type!) ? d.type : other;
    const index = deviceGroups.value.indexOf(group!);
    return selectedDeviceGroups.value.includes(index);
  });
});

const textFilteredDevices = computed(() => {
  return filteredDevices.value.filter(d => d.name?.toLocaleLowerCase().includes(filterText.value.toLocaleLowerCase()));
});

const pageSize = 20;
const page = ref(1);

watch(() => selectedDeviceGroups.value, () => page.value = 1);

const devicePages = computed(() => {
  const pages: (typeof textFilteredDevices.value)[] = [];
  for (let i = 0; i < textFilteredDevices.value.length; i += pageSize) {
    pages.push(textFilteredDevices.value.slice(i, i + pageSize));
  }
  return pages;
});

const devicePage = computed(() => devicePages.value[page.value - 1]);

const showIp = computed(() => {
  return devicePage.value?.some(d => d.info?.ip);
});

const showManufacturer = computed(() => {
  return devicePage.value?.some(d => d.info?.manufacturer);
});

const showModel = computed(() => {
  return devicePage.value?.some(d => d.info?.model);
});

const addDeviceDialog = ref(false);

</script>
