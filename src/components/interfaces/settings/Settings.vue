<template>
  <v-chip-group v-model="selectedSettingGroup" column class="mb-4" mandatory>
    <template v-for="group of settingsGroups">
      <v-chip :value="group" filter variant="flat" color="deep-purple-accent-4" size="small" rounded="0" class="ma-0">{{
        getTitle(group.title) }}</v-chip>
    </template>
  </v-chip-group>

  <div v-if="settingsSubgroups?.length > 1" style="border-radius: 16px; overflow: hidden;"
    :style="`border: 1px solid ${lineHintColor};`">
    <v-expansion-panels flat density="compact" v-model="selectedSettingSubgroup">
      <template v-for="group in settingsSubgroups">
        <v-expansion-panel :value="group">
          <v-expansion-panel-title
            :color="group?.title === selectedSettingSubgroup?.title ? 'deep-purple' : undefined">{{
              getTitle(group.title) }}</v-expansion-panel-title>
          <v-expansion-panel-text>
            <template v-for="setting in getSubgroupSettings(group.title)">
              <SplatSetting :model-value="setting"></SplatSetting>
            </template>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-divider></v-divider>
      </template>
    </v-expansion-panels>
  </div>
  <div v-else>
    <template v-for="group in settingsSubgroups">
      <template v-for="setting in getSubgroupSettings(group.title)">
        <SplatSetting :model-value="setting"></SplatSetting>
      </template>
    </template>
  </div>

  <!-- <template v-if="settingsSubgroups?.length > 1">
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
    <BooleanSetting v-else-if="setting.type === 'boolean'" :model-value="setting"></BooleanSetting>
    <ButtonSetting v-else-if="setting.type === 'button'" :model-value="setting"></ButtonSetting>
  </div> -->
</template>
<script setup lang="ts">
import { getLineHintColor } from '@/common/colors';
import { Setting } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
import SplatSetting from './SplatSetting.vue';

const lineHintColor = getLineHintColor();

function getTitle(title: string) {
  return title || 'General';
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

function getSubgroupSettings(subgroup: string) {
  return settingsInGroup.value.filter(setting => setting.subgroup === subgroup);
}

const settingsInSubgroup = computed(() => {
  if (!selectedSettingSubgroup.value)
    return;
  return getSubgroupSettings(selectedSettingSubgroup.value.title);
});

watch(() => settingsInSubgroup.value, () => {
  console.log(settingsInSubgroup.value);
})
</script>
