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
  </v-card>
</template>

<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { getFaPrefix } from '@/device-icons';
import { getDeviceFromRoute } from '@/id-device';
import { ScryptedInterface, Settings } from '@scrypted/types';
import SettingsInterface from './interfaces/settings/Settings.vue';

const { device } = getDeviceFromRoute<Settings>();

const settings = asyncComputed({
  async get() {
    if (!device.value.interfaces.includes(ScryptedInterface.Settings))
      return;
    return device.value.getSettings();
  },
  default: [],
  watch: {
    device: () => device.value,
  }
});
</script>
