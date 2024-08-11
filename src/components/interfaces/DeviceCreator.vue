<template>
  <v-card :title="`Add ${props.title || title}`">
    <template v-if="!id">
      <v-card-text>Add a device by choosing the device type below. If the device type is not available, supported
        devices can be extended by <router-link variant="text" to="/component/plugin/install">installing
          Plugins</router-link>.</v-card-text>
      <Settings v-model="idSettings" hide-border />
    </template>

    <Settings v-if="useId" v-model="settings" hide-border />

    <v-alert v-if="createError" class="ml-4 mr-4" color="error">{{ createError }}</v-alert>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn :disabled="creating" text="Cancel" @click="emits('click:cancel')"></v-btn>
      <v-btn v-if="useId" :disabled="creating" text="Add" @click="tryCreateDevice" color="success"></v-btn>
    </v-card-actions>
  </v-card>

</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectedClient } from '@/common/client';
import { adoptDevice, createDevice } from '@/device-creator';
import { getDeviceFromId } from '@/id-device';
import { DeviceCreator, DiscoveredDevice, ScryptedInterface, ScryptedSystemDevice } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Settings from './settings/Settings.vue';
import { TrackedSetting, normalizeBoolean, normalizeNumber } from './settings/setting-modelvalue';

const props = defineProps<{
  id?: string;
  discoveredDevice?: DiscoveredDevice;
  title?: string;
}>();

const emits = defineEmits<{
  (event: 'click:cancel'): void;
  (event: 'created'): void;
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
    if (props.discoveredDevice)
      return props.discoveredDevice?.settings || [];

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

const router = useRouter();
const createError = ref<string>();
const creating = ref(false);

async function tryCreateDevice() {
  creating.value = true;
  createError.value = undefined;
  try {
    if (props.discoveredDevice)
      await adoptDevice(router, useId.value, props.discoveredDevice.nativeId, settings.value);
    else
      await createDevice(router, useId.value, settings.value);
  }
  catch (e) {
    createError.value = (e as Error).message;
    return;
  }
  finally {
    creating.value = false;
  }

  emits('created');
}
</script>
