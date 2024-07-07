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
    <div class="ml-4 mr-4 mb-4">
      <SettingsInterface v-model="settings" :extra-chips="['Extensions']">
        <template v-slot:settings-group-chips>
          <v-chip color="deep-purple-accent-4" size="small" rounded="0" class="ma-0"
            :prepend-icon="getFaPrefix('fa-bolt')" :value="extensions">
            Extensions
          </v-chip>
        </template>
        <template v-slot:settings="slotProps">
          <Extensions :id="id" v-if="slotProps.selectedSettingGroup.title === 'Extensions'"></Extensions>
        </template>
      </SettingsInterface>
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
import { ScryptedInterface, Setting, Settings } from '@scrypted/types';
import { computed, ref } from 'vue';
import SettingsInterface from './interfaces/settings/Settings.vue';
import { TrackedSetting } from './interfaces/settings/setting-modelvalue';
import Extensions from './interfaces/settings/Extensions.vue';

const { id, device } = getDeviceFromRoute<Settings>();
const extensions = { title: 'Extensions', settings: [] as Setting[] };

const refreshSettings = ref(0);

registerListener(device, {
  event: ScryptedInterface.Settings,
}, () => {
  refreshSettings.value++;
});

// various plugins aren't using StorageSettings and are returning stringified values.
function normalizeBoolean(value: any) {
  if (value === 'true')
    return true;
  if (value === 'false')
    return false;
  return !!value;
}

function normalizeNumber(value: any) {
  return parseFloat(value);
}

const settings = asyncComputed({
  async get() {
    if (!device.value.interfaces.includes(ScryptedInterface.Settings))
      return;
    const settings = await device.value.getSettings();
    const ret: TrackedSetting[] = settings.map(setting => {
      if (setting.type === 'boolean')
        setting.value = normalizeBoolean(setting.value);
      else if (setting.type === 'number')
        setting.value = normalizeNumber(setting.value);
      const adjusted = {
        ...setting,
        originalValue: setting.value,
      };
      return adjusted;
    });
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
  const toSave = settings.value.filter(isDirty);
  for (const setting of toSave) {
    device.value.putSetting(setting.key, setting.value);
  }
}

</script>
