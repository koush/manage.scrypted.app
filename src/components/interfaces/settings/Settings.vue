<template>
  <v-chip-group v-if="settingsGroups?.length > 1 || slots.settings" v-model="selectedSettingGroup" column class="ml-7 mb-4 pt-0" mandatory
    :variant="chipVariant">
    <template v-for="group of settingsGroups">
      <v-chip :value="group" filter color="deep-purple-accent-4" size="small" rounded="0" class="ma-0">{{
        getTitle(group.title) }}</v-chip>
    </template>
    <slot name="settings-group-chips"></slot>
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
    <v-divider v-if="settingsGroups?.length > 1" class="mb-4"></v-divider>
    <template v-for="group in settingsSubgroups">
      <template v-for="setting in getSubgroupSettings(group.title)">
        <SplatSetting :model-value="setting"></SplatSetting>
      </template>
    </template>
  </div>
  <slot name="settings" :selectedSettingGroup="selectedSettingGroup"></slot>
</template>
<script setup lang="ts">
import { getLineHintColor } from '@/common/colors';
import { Setting } from '@scrypted/types';
import { computed, ref, useSlots, watch } from 'vue';
import { getChipVariant } from '../settings-chip';
import SplatSetting from './SplatSetting.vue';
import { TrackedSetting } from './setting-modelvalue';

const slots = useSlots();

const chipVariant = getChipVariant();

const lineHintColor = getLineHintColor();

function getTitle(title: string) {
  return title || 'General';
}

const modelValue = defineModel<TrackedSetting[]>();
const props = defineProps<{
  extraChips?: string[];
}>();

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
  const r = makeGroups(modelValue.value, 'group');
  return r;
});

const selectedSettingGroup = ref(settingsGroups.value?.[0]);
watch(() => settingsGroups.value, () => {
  if (props.extraChips?.includes(selectedSettingGroup.value?.title))
    return;
  selectedSettingGroup.value = settingsGroups.value.find(v => v.title === selectedSettingGroup.value?.title)
    || settingsGroups.value[0];
});

const settingsInGroup = computed(() => {
  if (!selectedSettingGroup.value)
    return;
  return modelValue.value.filter(setting => setting.group === selectedSettingGroup.value.title);
});

const settingsSubgroups = computed(() => {
  return makeGroups(settingsInGroup.value, 'subgroup');
});

const selectedSettingSubgroup = ref(settingsSubgroups.value?.[0]);
watch(() => settingsSubgroups.value, () => {
  selectedSettingSubgroup.value = settingsSubgroups.value.find(v => v.title === selectedSettingSubgroup.value?.title)
    || settingsSubgroups.value?.[0];
});

function getSubgroupSettings(subgroup: string) {
  return settingsInGroup.value.filter(setting => setting.subgroup === subgroup);
}
</script>
