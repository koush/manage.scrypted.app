<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card title="Devices" :prepend-icon="getFaPrefix('fa-microchip')">
          <v-chip-group class="ma-4" :model-value="selectedDeviceGroups" multiple column>
            <v-chip v-for="deviceGroup in deviceGroups" :key="deviceGroup"
              :filter-icon="deviceGroup === other ? typeToIcon(ScryptedDeviceType.Unknown) : typeToIcon(deviceGroup)"
              size="small" filter variant="flat" :color="isDefaultFilter ? 'deep-purple-accent-4' : 'info'"
              @click="e => clickChip(deviceGroup, e)" :rounded="0" class="pl-3"> {{
                deviceGroup
              }} ({{ devices.filter(d => (hasFixedPhysicalLocation(d.type!) ? d.type : other) ===
                deviceGroup).length }})</v-chip>
          </v-chip-group>
          <v-fade-transition>
            <v-text-field v-if="filteredDevices.length > pageSize" v-model="filterText"
              style="transform: scale(.75, .75)" title="Search" label="Search" density="compact"></v-text-field>
          </v-fade-transition>
          <v-table density="compact">
            <thead>
              <tr>
                <th style="width: 0;"></th>
                <th class="text-left">
                  Name
                </th>
                <th class="text-left" v-if="mdAndUp">Model</th>
                <th class="text-left" v-if="lgAndUp">Manufacturer</th>
                <th class="text-left" v-if="mdAndUp">IP</th>
                <th class="text-left" v-if="mdAndUp">
                  Plugin
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="device in devicePages[page - 1]" :key="device.id" @click="goDevice(router, device)"
                style="cursor: pointer;">
                <td><v-icon size="x-small">{{ typeToIcon(device.type) }}</v-icon></td>
                <td style="text-transform: uppercase; font-weight: 500">{{ device.name }}</td>
                <td v-if="mdAndUp">{{ device.info?.model }}</td>
                <td v-if="lgAndUp">{{ device.info?.manufacturer }}</td>
                <td v-if="mdAndUp">{{ device.info?.ip }}</td>
                <td v-if="mdAndUp"><v-btn color="info" size="small" variant="text" @click.stop
                    :to="`/device/${connectedClient!.systemManager.getDeviceById(device.pluginId).id}`">{{
                      connectedClient!.systemManager.getDeviceById(device.pluginId).name }}</v-btn></td>
              </tr>
            </tbody>
          </v-table>
          <v-pagination :length="devicePages.length" v-model="page" rounded density="compact"></v-pagination>
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

const router = useRouter();
const other = 'Other' as ScryptedDeviceType;

const { lgAndUp, mdAndUp } = useDisplay()

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
    if (d.interfaces.includes(ScryptedInterface.ScryptedPlugin))
      return false;
    // if this is this is a sub device ofanother device that has a fixed physical location, don't show it.
    const provider = connectedClient.value?.systemManager.getDeviceById(d.providerId!);
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
})

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


</script>
