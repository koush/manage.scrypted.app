<template>
  <v-container fluid>
    <v-row>
      <ResponsiveColumn cols="12" md="6">
        <v-card v-if="settings?.length" class="mb-4">
          <template v-slot:prepend>
            <v-icon size="xx-small">{{ getFaPrefix('fa-gear') }}</v-icon>
          </template>
          <template v-slot:append>
            <v-btn :variant="dirtyCount ? 'flat' : 'text'" color="success" size="small" :disabled="!dirtyCount"
              @click="save">Save</v-btn>
          </template>
          <template v-slot:title>
            <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
              Scrypted Settings
            </v-card-subtitle>
          </template>
          <div>
            <SettingsInterface v-model="settings"></SettingsInterface>
          </div>
        </v-card>

        <ServerManagement></ServerManagement>
      </ResponsiveColumn>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectPluginClient, connectedClient } from '@/common/client';
import { getAllDeviceIds } from '@/common/devices';
import { getFaPrefix } from '@/device-icons';
import { registerListeners } from '@/id-device';
import { ScryptedInterface, ScryptedSystemDevice, Setting, Settings } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
import { isDirty, trackSetting } from './interfaces/settings/setting-modelvalue';
import SettingsInterface from './interfaces/settings/Settings.vue';
import ServerManagement from './ServerManagement.vue';
import ResponsiveColumn from './ResponsiveColumn.vue';
import { timeoutPromise } from '@scrypted/common/src/promise-utils';

function getScryptedSettingsIds() {
  if (!connectedClient.value)
    return [];
  const { systemManager } = connectedClient.value;
  return getAllDeviceIds()
    .filter(id => {
      const d = systemManager.getDeviceById(id);
      return d.interfaces.includes(ScryptedInterface.ScryptedSettings) || d.interfaces.includes("SystemSettings");
    });
}

const scryptedSettingsDevices = computed(() => {
  if (!connectedClient.value)
    return [];
  return getScryptedSettingsIds().map(id => connectedClient.value.systemManager.getDeviceById<Settings & ScryptedSystemDevice>(id));
});

const refreshSettings = ref(0);
const refreshPending = ref(false);

const settings = asyncComputed({
  async get() {
    const all = scryptedSettingsDevices.value.map(async d => {
      const name = d.systemDevice?.settings || d.name;
      let settings: Setting[];
      try {
        settings = await timeoutPromise(5000, d.getSettings());
      }
      catch (e) {
        settings = [
          {
            title: `${name} Settings Failure`,
            description: 'Settings failed to load.'
          }
        ];
      }

      return settings.map(setting => ({
        ...setting,
        key: `${d.id}:${setting.key}`,
        group: name,
        subgroup: setting.group,
      } as Setting));
    });

    const stacked = await Promise.all(all);
    const flat = stacked.flat();

    const sorted = flat
      .sort((s1, s2) => {
        // alphabetical unless the group title is General
        if (s1.group === s2.group)
          return flat.indexOf(s1) - flat.indexOf(s2);
        if (s1.group === 'General')
          return -1;
        if (s2.group === 'General')
          return 1;
        return s1.group.localeCompare(s2.group);
      })
    return sorted.map(trackSetting);
  },
  default(previousValue) {
    return previousValue || [];
  },
  watch: {
    refreshSettings: () => refreshSettings.value,
    scryptedSettingsDevices: () => scryptedSettingsDevices.value,
  }
});

const dirtyCount = computed(() => {
  return settings.value.filter(isDirty).length;
});

registerListeners(() => getScryptedSettingsIds(), {
  event: ScryptedInterface.Settings,
}, () => {
  if (!dirtyCount.value) {
    refreshSettings.value++;
  }
  else {
    refreshPending.value = true;
  }
});

watch(() => dirtyCount.value, async () => {
  if (dirtyCount.value || !refreshPending.value)
    return;
  refreshPending.value = false;
  refreshSettings.value++;
});

watch(() => dirtyCount.value, async () => {
  const { systemManager } = connectedClient.value || await connectPluginClient();
  const toSave = settings.value.filter(isDirty).filter(s => s.immediate)
  for (const setting of toSave) {
    const [id, ...key] = setting.key.split(':');
    const device = systemManager.getDeviceById<Settings>(id);
    device.putSetting(key.join(':'), setting.value);
  }
});

async function save() {
  const { systemManager } = connectedClient.value || await connectPluginClient();
  const toSave = settings.value.filter(isDirty);
  for (const setting of toSave) {
    const [id, ...key] = setting.key.split(':');
    const device = systemManager.getDeviceById<Settings>(id);
    device.putSetting(key.join(':'), setting.value);
  }
}
</script>
