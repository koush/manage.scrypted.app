<template>
  <v-card title="Add Device">
    <div class="ma-4">
      <Settings v-if="!id" v-model="idSettings" hide-border />
      <Settings v-if="useId" v-model="settings" hide-border />
    </div>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" @click="emits('click:cancel')"></v-btn>
      <v-btn v-if="useId" text="Add" @click="emits('click:create', useId, settings)" color="success"></v-btn>
    </v-card-actions>
  </v-card>

</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectedClient } from '@/common/client';
import { getDeviceFromId } from '@/id-device';
import { DeviceCreator, ScryptedInterface, Setting } from '@scrypted/types';
import { ref, watch } from 'vue';
import Settings from './settings/Settings.vue';
import { TrackedSetting, normalizeBoolean, normalizeNumber } from './settings/setting-modelvalue';

const props = defineProps<{
  id?: string,
}>();

const emits  = defineEmits<{
  (event: 'click:cancel'): void;
  (event: 'click:create', id: string, settings: Setting[]): void;
}>();

const useId = ref<string>(props.id);
const device = getDeviceFromId<DeviceCreator>(() => useId.value);

const idSettings = ref<TrackedSetting[]>([
  {
    title: 'Device Type',
    description: 'The type of device to create.',
    placeholder: 'Select a device type',
    type: 'device',
    key: 'deviceType',
    deviceFilter: `interfaces.includes('${ScryptedInterface.DeviceCreator}')`,
    getDeviceTitle(id: string) {
      const device = connectedClient.value.systemManager.getDeviceById<DeviceCreator>(id);
      if (!device)
        return '';
      return device.createdDevice || device.name;
    }
  }
]);

watch(() => idSettings.value?.[0]?.value, async () => {
  if (!idSettings.value?.[0]?.value)
    return;
  useId.value = idSettings.value[0].value as string;
});

const settings = asyncComputed({
  async get() {
    if (!device.value.interfaces.includes(ScryptedInterface.DeviceCreator))
      return;
    const settings = await device.value.getCreateDeviceSettings();
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
  }
});

</script>
