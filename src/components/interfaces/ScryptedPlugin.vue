<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn v-if="!npmUpdate?.updateAvailable" v-bind="props" density="compact" color="info"
        :append-icon="getFaPrefix('fa-caret-down')" style="text-transform: unset;">v{{
          device.info.version }}</v-btn>
      <v-btn v-else v-bind="props" density="compact" color="warning" :append-icon="getFaPrefix('fa-caret-down')"
        style="text-transform: unset;">Update Available</v-btn>
    </template>
    <v-list density="compact">
      <template v-for="(item, index) in npmVersions" :key="index" :value="index">
        <v-list-item @click="installPluginVersion(device.info.manufacturer, item.version)">
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
import { installPlugin } from '../plugin/plugin-apis';

const props = defineProps<{
  id: string;
}>();

const emits = defineEmits<{
  (event: 'update:plugin'): void;
}>();

async function installPluginVersion(pkg: string, version: string) {
  emits('update:plugin');
  await installPlugin(pkg, version);
}

const device = getDeviceFromId<ScryptedPlugin>(() => props.id);

const npmUpdate = asyncComputed({
  async get() {
    const npm = await checkNpmUpdate(device.value.info.manufacturer, device.value.info.version);
    return npm;
  },
  watch: {
    info: () => device.value?.info,
  }
});

const npmVersions = computed(() => {
  if (!npmUpdate.value)
    return [];
  const ret = npmUpdate.value.versions.slice(0, 5);
  const installed = ret.find(v => v.version === device.value.info.version);
  if (installed) {
    installed.tag = 'installed';
  }
  else {
    ret.push({
      version: device.value.info.version,
      tag: 'installed',
    });
  }
  return ret;
});

function getChipColor(item: typeof npmUpdate.value.versions[0]) {
  if (!item.tag)
    return;
  if (item.tag === 'latest')
    return 'warning';
  if (item.tag === 'beta')
    return 'error';
  return 'info';
}
</script>
