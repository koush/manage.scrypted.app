<template>
  <v-autocomplete class="shrink" :readonly="modelValue.readonly" density="compact" variant="outlined"
    :label="modelValue.title" :hint="modelValue.description" v-model="value" :items="choices" return-object
    :multiple="modelValue.multiple" :chips="modelValue.multiple" :closable-chips="modelValue.multiple"
    :persistent-hint="!!modelValue.description" :hide-details="!modelValue.description" persistent-placeholder>
    <template v-if="modelValue.multiple" v-slot:chip="{ props }">
      <v-chip v-bind="props" :color="chipColor" :variant="chipVariant"></v-chip>
    </template>
    <template v-slot:no-data>
    </template>
  </v-autocomplete>
</template>
<script setup lang="ts">
import { connectedClient } from '@/common/client';
import { getAllDevices } from '@/common/devices';
import { computed } from 'vue';
import { chipColor, getChipVariant } from '../settings-common';
import { TrackedSetting } from './setting-modelvalue';

const chipVariant = getChipVariant();

const modelValue = defineModel<TrackedSetting>();

const value = computed({
  get() {
    if (!modelValue.value.multiple) {
      const value = modelValue.value.value as string;
      if (!value)
        return;
      const [id, deviceInterface] = value.split('#', 2);
      if (!id || !deviceInterface)
        return;
      const device = connectedClient.value?.systemManager.getDeviceById(id);
      const title = device.name + ` (${deviceInterface})`;

      return {
        title,
        value,
      }
    }

    let values = modelValue.value.value as string[];
    if (!Array.isArray(values))
      values = [];
    return values.map(value => {
      const [id, deviceInterface] = value.split('#', 2);
      const device = connectedClient.value?.systemManager.getDeviceById(id);
      if (!device)
        return;
      const title = device.name + ` (${deviceInterface})`;
      return {
        title,
        value,
      }
    })
      .filter(v => v);
  },
  set(value) {
    if (!Array.isArray(value))
      modelValue.value.value = value.value;
    else
      modelValue.value.value = value.map(v => v.value);
  }
});

const choices = computed(() => {
  if (modelValue.value.choices && !modelValue.value.deviceFilter) {
    return modelValue.value.choices.map(choice => ({
      title: connectedClient.value.systemManager.getDeviceById(choice).name,
      value: choice,
    }));
  }

  const allDeviceInterfaces = getAllDevices().map(device => device.interfaces.map(deviceInterface => ({
    device,
    deviceInterface,
  }))).flat();

  let ret = allDeviceInterfaces;

  if (modelValue.value.deviceFilter) {
    let expression;
    try {
      expression = modelValue.value.deviceFilter || "true;";
    } catch (e) {
      expression = "true;";
    }

    ret = allDeviceInterfaces.filter(({ device, deviceInterface }) => {
      try {
        const script = `(function() {
          var interfaces = ${JSON.stringify(device.interfaces)};
          var deviceInterface = '${deviceInterface}';
          var type='${device.type}';
          return ${expression};
        })`

        return eval(script)();
      } catch (e) {
        console.warn(e);
        return true;
      }
    });
  }

  return ret.map(({ device, deviceInterface }) => ({
    title: device.name + ` (${deviceInterface})`,
    value: device.id + "#" + deviceInterface,
  }));
});

</script>
<style scoped>
.shrink {
  transform: scale(.8, .8);
  width: 125%;
  transform-origin: 0% 50%;
}

.chip-group-round:first-child {
  border-radius: 16px 0px 0px 16px !important;
}

.chip-group-round:last-child {
  border-radius: 0px 16px 16px 0px !important;
}
</style>
