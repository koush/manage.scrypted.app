<template>
  <Settings v-model="settings" />
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { getDeviceFromId } from '@/id-device';
import { DeviceCreator, ScryptedInterface } from '@scrypted/types';
import { TrackedSetting, normalizeBoolean, normalizeNumber } from './settings/setting-modelvalue';
import Settings from './settings/Settings.vue';

const props = defineProps<{
    id: string,
}>();

const device = getDeviceFromId<DeviceCreator>(() => props.id);

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
