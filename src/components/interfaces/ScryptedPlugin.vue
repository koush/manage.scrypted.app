<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn v-if="!npmUpdate?.updateAvailable" v-bind="props" density="compact" color="info"
        :append-icon="getFaPrefix('fa-caret-down')" style="text-transform: unset;">v{{
          device.info.version }}</v-btn>
      <v-btn v-else v-bind="props" density="compact" color="info" :append-icon="getFaPrefix('fa-caret-down')"
        style="text-transform: unset;">Update Available</v-btn>
    </template>
    <v-list density="compact">
      <template v-for="(item, index) in npmVersions" :key="index" :value="index">
        <v-list-item>
          <v-list-item-title>v{{ item.version }}</v-list-item-title>
          <template v-slot:append v-if="item.tag">
            <v-chip variant="flat" size="x-small" class="ml-8" :color="getChipColor(item)">{{ item.tag }}</v-chip>
          </template>
        </v-list-item>
        <v-divider v-if="!index"></v-divider>
      </template>
    </v-list>
  </v-menu>
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { getFaPrefix } from '@/device-icons';
import { getDeviceFromId } from '@/id-device';
import { checkNpmUpdate } from '@/npm';
import { ScryptedPlugin } from '@scrypted/types';
import { computed } from 'vue';

const props = defineProps<{
  id: string;
}>();

const device = getDeviceFromId<ScryptedPlugin>(() => props.id);

const npmUpdate = asyncComputed({
  async get() {
    const npm = await checkNpmUpdate(device.value.info.manufacturer, device.value.info.version);
    console.warn(npm);
    return npm;
  },
});


const npmVersions = computed(() => {
  if (!npmUpdate.value)
    return [];
  return npmUpdate.value.versions.slice(0, 10);
});

function getChipColor(item: typeof npmUpdate.value.versions[0]) {
  if (!item.tag)
    return;
  if (item.tag === 'latest')
    return 'info';
  if (item.tag === 'beta')
    return 'error';
  return 'warning';
}
</script>
