<template>
  <v-card :title="`Add ${title}`">
    <template v-if="!id">
      <v-card-text>Add a device by choosing the device type below. If the device type is not available, supported devices can be extended by <router-link variant="text" to="/component/plugin/install">installing Plugin</router-link>.</v-card-text>
      <Settings v-model="idSettings" hide-border />
    </template>

      
      <Settings v-if="useId" v-model="settings" hide-border />

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
import { DeviceCreator, ScryptedInterface, ScryptedSystemDevice, Setting } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
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
const device = getDeviceFromId<DeviceCreator & ScryptedSystemDevice>(() => useId.value);

const title = computed(() => {
  return device.value?.systemDevice?.deviceCreator || "Device";
});

const idSettings = ref<TrackedSetting[]>([
  {
    title: 'Device Type',
    description: 'The type of device to create.',
    placeholder: 'Select a device type',
    type: 'device',
    key: 'deviceType',
    deviceFilter: `interfaces.includes('${ScryptedInterface.DeviceCreator}') && interfaces.includes('${ScryptedInterface.ScryptedDeviceCreator}')`,
    getDeviceTitle(id: string) {
      const device = connectedClient.value.systemManager.getDeviceById<DeviceCreator & ScryptedSystemDevice>(id);
      if (!device)
        return '';
      return device.systemDevice?.deviceCreator || device.name;
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
