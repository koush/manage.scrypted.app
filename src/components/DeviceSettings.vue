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
import { getDeviceFromId, registerListener } from '@/id-device';
import { ScryptedInterface, Setting, Settings } from '@scrypted/types';
import { computed, ref } from 'vue';
import Extensions from './interfaces/settings/Extensions.vue';
import SettingsInterface from './interfaces/settings/Settings.vue';
import { isDirty, trackSetting } from './interfaces/settings/setting-modelvalue';

const props = defineProps<{
  id: string;
}>();

const device = getDeviceFromId<Settings>(() => props.id);
const extensions = { title: 'Extensions', settings: [] as Setting[] };

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
    const ret = settings.map(trackSetting);
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
