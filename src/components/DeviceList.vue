<template>
  <v-container fluid>
    <v-row>
      <ResponsiveColumn cols="12">
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
              <v-btn v-if="isAdmin" size="x-small" class="ml-4" color="info" to="/component/plugin/install"
                variant="outlined">Install
                Plugin</v-btn>
            </div>
          </template>

          <template v-if="deviceGroups.length <= 1">
            <div
              style="height: 300px; display: flex; text-align: center; flex-direction: column; justify-content: center; align-items: center;">
              <div>Welcome to Scrypted.</div>
              <div>Get started by installing the plugin that supports your hardware. Then add the device below or within
                the plugin.</div>
              <div style="display: flex;" class="mt-4">
                <v-btn variant="flat" size="x-small" class="ml-4" color="info" to="/component/plugin/install">Install
                  Plugin</v-btn>
                <v-btn variant="flat" color="success" class="ml-4" size="x-small" @click="addDeviceDialog = true">Add
                  Device</v-btn>
              </div>

            </div>
          </template>
          <template v-else>
            <DevicePagination :devices="devices" :device-groups="deviceGroups" show-physical-only></DevicePagination>
          </template>
        </v-card>
      </ResponsiveColumn>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { connectPluginClient, connectedClient, isAdmin } from '@/common/client';
import { getAllDevices } from '@/common/devices';
import { getFaPrefix, hasFixedPhysicalLocation } from '@/util/device-icons';
import { ScryptedInterface } from '@scrypted/types';
import { computed, ref } from 'vue';
import DevicePagination from './DevicePagination.vue';
import DeviceCreatorInterface from './interfaces/DeviceCreator.vue';
import ResponsiveColumn from './ResponsiveColumn.vue';
import { createDeviceGroups } from './device-pagination';

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
    if (provider?.id === d.id) {
      // this is the root plugin device which has a fixed physical location type, so show it
      return true;
    }
    if (!provider?.type)
      return true;
    if (hasFixedPhysicalLocation(provider?.type))
      return false;
    return true;
  })
    .sort((a, b) => a.name!.localeCompare(b.name!));
  return ret;
});

const deviceGroups = createDeviceGroups(() => devices.value);

const addDeviceDialog = ref(false);

</script>
