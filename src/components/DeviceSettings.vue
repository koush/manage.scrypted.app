<template>
  <v-card v-if="settings?.length">
    <template v-slot:prepend>
      <v-icon size="xx-small">{{ getFaPrefix('fa-gear') }}</v-icon>
    </template>
    <template v-slot:title>
      <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
        Settings
      </v-card-subtitle>
    </template>
    <div class="ml-4 mr-4 mb-4" >
      <SettingsInterface v-model="settings"></SettingsInterface>
    </div>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn variant="text" size="small" :disabled="!dirtyCount" @click="save">Save</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { getFaPrefix } from '@/device-icons';
import { getDeviceFromRoute, registerListener } from '@/id-device';
import { ScryptedInterface, Settings } from '@scrypted/types';
import { computed, ref } from 'vue';
import SettingsInterface from './interfaces/settings/Settings.vue';
import { TrackedSetting } from './interfaces/settings/setting-modelvalue';

const { device } = getDeviceFromRoute<Settings>();

const refreshSettings = ref(0);

registerListener(device, {
  event: ScryptedInterface.Settings,
}, () => {
  refreshSettings.value++;
});

const settings = asyncComputed({
  async get() {
    if (!device.value.interfaces.includes(ScryptedInterface.Settings))
      return;
    const settings = await device.value.getSettings();
    const ret: TrackedSetting[] = settings.map(setting => ({
      ...setting,
      originalValue: setting.value,
    }));
    return ret;
  },
  default(previousValue) {
    return previousValue || [];
  },
  watch: {
    device: () => device.value,
    refreshSettings: () => refreshSettings.value,
  }
});

function isDirty(setting: TrackedSetting) {
  return JSON.stringify(setting.value) !== JSON.stringify(setting.originalValue);
}

const dirtyCount = computed(() => {
  return settings.value.filter(isDirty).length;
});

function save() {
  // const toSave = settings.value.filter(isDirty);
  // console.log(toSave);
}

</script>
