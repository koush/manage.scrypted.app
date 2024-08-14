<template>
  <v-menu location="bottom right" :close-on-content-click="false" v-model="menu">
    <template v-slot:activator="{ props }">
      <v-btn v-if="!npmUpdate?.updateAvailable" v-bind="props" density="compact" color="info"
        :append-icon="getFaPrefix('fa-caret-down')" style="text-transform: unset;">v{{
          device.info.version }}</v-btn>
      <v-btn v-else v-bind="props" density="compact" color="warning" :append-icon="getFaPrefix('fa-caret-down')"
        style="text-transform: unset;">Update Available</v-btn>
    </template>
    <v-list density="compact" width="300">
      <Pagination :items="npmUpdate?.versions" :pageSize="7">
        <template v-slot:item="{ item }: { item: NpmVersion }">
          <v-list-subheader v-if="!item">Other Versions</v-list-subheader>
          <v-list-item v-else @click="menu = false; installPluginVersion(device.info.manufacturer, item.version)">
            <v-list-item-title>v{{ item.version }}</v-list-item-title>
            <v-list-item-subtitle style="font-size: .6rem">{{ item.time }}</v-list-item-subtitle>
            <template v-slot:append v-if="item.tag">
              <v-chip variant="flat" size="x-small" class="ml-8" :color="getChipColor(item)">{{ item.tag }}</v-chip>
            </template>
          </v-list-item>
          <v-divider
            v-if="item?.version === installedNpmVersion.version || item?.version === latestNpmVersion.version"></v-divider>
        </template>
      </Pagination>
      <v-btn variant="text" color="info" block prepend-icon="fab fa-npm"
        :href="`https://www.npmjs.com/package/${device.info.manufacturer}`" target="_blank">View
        On NPM</v-btn>
    </v-list>
  </v-menu>
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { getFaPrefix } from '@/device-icons';
import { getDeviceFromId } from '@/id-device';
import { checkNpmUpdate, NpmVersion } from '@/npm';
import { ScryptedPlugin } from '@scrypted/types';
import { computed, ref } from 'vue';
import Pagination from '../Pagination.vue';
import { installPlugin } from '../../internal-apis';

const menu = ref(false);

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

const installedNpmVersion = computed(() => {
  const def: NpmVersion = {
    version: device.value.info.version,
    tag: 'installed',
    time: '',
  };
  if (!npmUpdate.value)
    return def;

  const installed = npmUpdate.value.versions.find(v => v.version === device.value.info.version);
  const ret = installed || def;
  ret.tag = 'installed';
  return ret;
});

const latestNpmVersion = computed(() => {
  const def: NpmVersion = {
    version: device.value.info.version,
    tag: 'latest',
    time: '',
  };
  if (!npmUpdate.value)
    return def;

  const installed = npmUpdate.value.versions.find(v => v.tag === 'latest');
  const ret = installed || def;
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
