<template>
  <v-chip-group v-model="selectedSettingGroup" column class="mb-4" mandatory>
    <template v-for="group of settingsGroups">
      <v-chip :value="group" filter variant="flat" color="deep-purple-accent-4" size="small" rounded="0" class="ma-0">{{
        getTitle(group.title) }}</v-chip>
    </template>
  </v-chip-group>

  <template v-if="settingsSubgroups?.length > 1">
    <v-divider class="mb-4"></v-divider>
    <v-list-item-subtitle>{{ getTitle(selectedSettingGroup?.title) }} > {{ getTitle(selectedSettingSubgroup?.title)
      }}</v-list-item-subtitle>
    <v-chip-group v-model="selectedSettingSubgroup" column class="mb-4" mandatory>
      <v-chip v-for="group of settingsSubgroups" :value="group" filter variant="flat" color="deep-purple-accent-4"
        size="small" rounded="0" class="ma-0">{{
          getTitle(group.title) }}</v-chip>
    </v-chip-group>
  </template>

  <div v-for="setting in settingsInSubgroup" class="">
    <ChoiceString v-if="setting.choices" :model-value="setting"></ChoiceString>
    <StringSetting v-else-if="isStringType(setting.type)" :model-value="setting"></StringSetting>
  </div>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
import ChoiceString from './ChoiceString.vue';
import StringSetting from './StringSetting.vue';

let setting: Setting;

function getTitle(title: string) {
  return title || 'General';
}

function isStringType(type: typeof setting.type) {
  switch (type) {
    case undefined:
    case null:
    case 'string':
    case 'number':
    case 'integer':
    case 'password':
      return true;
  }
  return false;
}

const modelValue = defineModel<Setting[]>();

function makeGroups(settings: Setting[], groupKey: 'group' | 'subgroup') {
  if (!settings)
    return;
  const groups: {
    title: string;
    settings: Setting[];
  }[] = [];


  for (const setting of settings) {
    const group = groups.find(group => group.title === setting[groupKey]);
    if (!group) {
      groups.push({
        title: setting[groupKey],
        settings: [setting],
      });
    }
    else {
      group.settings.push(setting);
    }
  }

  return groups;
}

const settingsGroups = computed(() => {
  return makeGroups(modelValue.value, 'group');
});

const selectedSettingGroup = ref<typeof settingsGroups.value[0]>();
watch(() => settingsGroups.value, () => {
  selectedSettingGroup.value = settingsGroups.value[0];
});

const settingsInGroup = computed(() => {
  if (!selectedSettingGroup.value)
    return;
  return modelValue.value.filter(setting => setting.group === selectedSettingGroup.value.title);
});

const settingsSubgroups = computed(() => {
  return makeGroups(settingsInGroup.value, 'subgroup');
});

const selectedSettingSubgroup = ref<typeof settingsSubgroups.value[0]>();
watch(() => settingsSubgroups.value, () => {
  selectedSettingSubgroup.value = settingsSubgroups.value[0];
});

const settingsInSubgroup = computed(() => {
  if (!selectedSettingSubgroup.value)
    return;
  return settingsInGroup.value.filter(setting => setting.subgroup === selectedSettingSubgroup.value.title);
});

watch(() => settingsInSubgroup.value, () => {
  console.log(settingsInSubgroup.value);
})
</script>
