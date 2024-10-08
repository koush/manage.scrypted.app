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
      const title = modelValue.value.getDeviceTitle
        ? modelValue.value.getDeviceTitle(value)
        : (connectedClient.value?.systemManager.getDeviceById(value)?.name || modelValue.value.placeholder || '');

      return {
        title,
        value,
      }
    }

    let values = modelValue.value.value as string[];
    if (!Array.isArray(values))
      values = [];
    return values.map(value => ({
      title: modelValue.value.getDeviceTitle
        ? modelValue.value.getDeviceTitle(value)
        : (connectedClient.value?.systemManager.getDeviceById(value)?.name || modelValue.value.placeholder || ''),
      value,
    }));
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

  const allDevices = getAllDevices();
  let ret = allDevices;

  if (modelValue.value.deviceFilter) {
    let expression;
    try {
      expression = modelValue.value.deviceFilter || "true;";
    } catch (e) {
      expression = "true;";
    }

    ret = allDevices.filter(device => {
      try {
        return eval(
          `(function() { var interfaces = ${JSON.stringify(
            device.interfaces
          )}; var type='${device.type}'; var id = '${device.id}'; return ${expression} })`
        )();
      } catch (e) {
        return true;
      }
    });
  }

  return ret.map(device => ({
    title: modelValue.value.getDeviceTitle ? modelValue.value.getDeviceTitle(device.id) : device.name,
    value: device.id,
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
