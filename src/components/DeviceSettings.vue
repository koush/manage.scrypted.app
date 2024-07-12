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
    <template v-slot:append>
      <v-btn :variant="dirtyCount ? 'flat' : 'text'" size="small" :disabled="!dirtyCount" @click="save"
        color="success">Save</v-btn>
    </template>
    <div>
      <SettingsInterface v-model="settings" :extra-groups="['Extensions']"
        @click-button-setting="setting => emits('click-button-setting', setting)">
        <template v-slot:settings-expansion-panels="slotProps">
          <v-expansion-panel :value="extensions">
            <v-expansion-panel-title style="min-height: unset; height: 24px; font-size: .75rem;"
              :color="'Extensions' === slotProps.selectedSettingGroup?.title ? 'deep-purple' : undefined">Extensions</v-expansion-panel-title>
            <v-expansion-panel-text>
              <Extensions :id="id" v-if="slotProps.selectedSettingGroup?.title === 'Extensions'"></Extensions>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-divider></v-divider>
        </template>
      </SettingsInterface>
    </div>
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
import { SettingsGroup } from './interfaces/settings-common';

const props = defineProps<{
  id: string;
}>();

const emits = defineEmits<{
  (event: 'click-button-setting', setting: Setting): void;
}>();

const device = getDeviceFromId<Settings>(() => props.id);
const extensions: SettingsGroup = { title: 'Extensions', subgroups: [] };

const refreshSettings = ref(0);

registerListener(device, {
  event: ScryptedInterface.Settings,
}, () => {
  refreshSettings.value++;
});

const settings = asyncComputed({
  async get({ clearOldValue }) {
    if (!device.value.interfaces.includes(ScryptedInterface.Settings)) {
      clearOldValue();
      return;
    }
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
