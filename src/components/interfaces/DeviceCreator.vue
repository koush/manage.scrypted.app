<template>
  <Settings v-if="!id" v-model="idSettings" hide-border />
  <Settings v-if="useId" v-model="settings" hide-border />
</template>
<script setup lang="ts">
import { getDeviceFromId } from '@/id-device';
import { DeviceCreator, ScryptedInterface, Setting } from '@scrypted/types';
import { ref } from 'vue';
import Settings from './settings/Settings.vue';
import { TrackedSetting, normalizeBoolean, normalizeNumber } from './settings/setting-modelvalue';
import { watch } from 'vue';
import { asyncComputed } from '@/common/async-computed';

const props = defineProps<{
  id?: string,
}>();

const useId = ref<string>(props.id);
const device = getDeviceFromId<DeviceCreator>(() => useId.value);

function toTrackedSettings(settings: Setting[]) {
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
}

const idSettings = ref<Setting[]>(toTrackedSettings([
  {
    title: 'Device Type',
    description: 'The type of device to create.',
    placeholder: 'Select a device type',
    type: 'device',
    key: 'deviceType',
    deviceFilter: `interfaces.includes('${ScryptedInterface.DeviceCreator}')`,
  }
]));

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
