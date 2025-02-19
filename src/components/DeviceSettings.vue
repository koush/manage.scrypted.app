<template>
  <v-card v-if="isAdmin || settings.length">
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
      <SettingsInterface v-model="settings" :extra-groups="extraGroups"
        @click-button-setting="setting => emits('click-button-setting', setting)">
        <template v-slot:settings-expansion-panels="slotProps">
          <v-expansion-panel v-if="isAdmin" :value="extensions" :collapse-icon="getFaPrefix('fa-caret-up')"
            :expand-icon="getFaPrefix('fa-caret-down')">
            <v-expansion-panel-title
              style="min-height: unset; height: 24px; font-size: .8rem; font-weight: 450; text-transform: uppercase;"
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
import { ScryptedDeviceType, ScryptedInterface, Setting, Settings } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
import { SettingsGroup } from './interfaces/settings-common';
import Extensions from './interfaces/settings/Extensions.vue';
import SettingsInterface from './interfaces/settings/Settings.vue';
import { isDirty, trackSetting } from './interfaces/settings/setting-modelvalue';
import { isAdmin } from '@/common/client';
import { getAllDevices } from '@/common/devices';

const props = defineProps<{
  id: string;
}>();

const emits = defineEmits<{
  (event: 'click-button-setting', setting: Setting): void;
  (event: 'show-console'): void;
}>();

const device = getDeviceFromId<Settings>(() => props.id);
const extensions: SettingsGroup = { title: 'Extensions', subgroups: [] };

const isScryptedPlugin = computed(() => {
  return device.value.interfaces.includes(ScryptedInterface.ScryptedPlugin);
});

const isEditable = computed(() => {
  if (isScryptedPlugin.value)
    return false;
  switch (device.value?.providedType) {
    case ScryptedDeviceType.Internal:
    case ScryptedDeviceType.Builtin:
    case ScryptedDeviceType.API:
    case ScryptedDeviceType.Person:
      return false;
  }
  return true;
});

const extraGroups = computed(() => {
  if (!isAdmin.value)
    return [];
  const groups = ['Extensions'];
  return groups;
});

const refreshSettings = ref(0);

registerListener(device, {
  event: ScryptedInterface.Settings,
}, () => {
  refreshSettings.value++;
});

const settings = asyncComputed({
  async get() {
    let settings: Setting[];
    if (!device.value.interfaces.includes(ScryptedInterface.Settings)) {
      settings = [];
    }
    else {
      settings = await device.value.getSettings();
    }

    if (isEditable.value && isAdmin.value) {
      const allRooms = new Set(getAllDevices().map(d => d.room).filter(r => r));

      settings.push(
        {
          group: 'Edit',
          title: 'Name',
          key: 'ui:name',
          value: device.value.name,
        },
        {
          group: 'Edit',
          title: 'Type',
          key: 'ui:type',
          value: device.value.type,
          choices: Object.keys(ScryptedDeviceType),
          combobox: true,
        },
        {
          group: 'Edit',
          title: 'Room',
          key: 'ui:room',
          value: device.value.room,
          choices: [...allRooms],
          combobox: true,
        },
      );
    }

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

watch(() => dirtyCount.value, () => {
  const toSave = settings.value.filter(isDirty).filter(s => s.immediate)
  for (const setting of toSave) {
    if (setting.console)
      emits('show-console');
    device.value.putSetting(setting.key, setting.value);
  }
});

function save() {
  const toSave = settings.value.filter(isDirty);
  for (const setting of toSave) {
    if (setting.console)
      emits('show-console');
    if (setting.key.startsWith('ui:')) {
      const key = setting.key.substring(3);
      setting.originalValue = setting.value;
      if (key === 'name') {
        device.value.setName(setting.value?.toString());
      }
      else if (key === 'type') {
        device.value.setType(setting.value?.toString() as ScryptedDeviceType);
      }
      else if (key === 'room') {
        device.value.setRoom(setting.value?.toString() || undefined);
      }
    }
    else {
      device.value.putSetting(setting.key, setting.value);
    }
  }
}

</script>
