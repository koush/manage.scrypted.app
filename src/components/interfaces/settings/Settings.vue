<template>
  <div>
    <v-expansion-panels flat density="compact" v-model="selectedSettingGroup" variant="accordion"
      :mandatory="totalExpansionPanels <= 1">

      <template v-for="group in settingsGroups">
        <v-expansion-panel :value="group">
          <v-expansion-panel-title v-if="totalExpansionPanels > 1"
            style="min-height: unset; height: 24px; font-size: .75rem;"
            :color="selectedSettingGroup && group?.title === selectedSettingGroup?.title ? 'deep-purple' : undefined">{{
              getTitle(group.title) }}</v-expansion-panel-title>
          <v-tabs
            v-if="selectedSettingGroup && group.title === selectedSettingGroup?.title && group.subgroups?.length > 1"
            v-model="selectedSettingSubgroup" mandatory density="compact" grow center-active show-arrows
            :prev-icon="getFaPrefix('fa-caret-left')" :next-icon="getFaPrefix('fa-caret-right')"
            :bg-color="dark ? 'deep-purple' : undefined" :color="!dark ? 'deep-purple' : undefined">
            <template v-for="subgroup of group.subgroups">
              <v-tab :value="subgroup" size="small">{{
                getTitle(subgroup.title) }}</v-tab>
            </template>
          </v-tabs>

          <v-expansion-panel-text>
            <v-tabs-window v-model="selectedSettingSubgroup">
              <template v-for="setting in selectedSettingSubgroup?.settings">
                <SplatSetting :model-value="setting" @click-button-setting="emits('click-button-setting', setting)">
                </SplatSetting>
              </template>
            </v-tabs-window>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-divider></v-divider>
      </template>

      <slot name="settings-expansion-panels" :selectedSettingGroup="selectedSettingGroup"></slot>

    </v-expansion-panels>
  </div>
</template>
<script setup lang="ts">
import { Setting } from '@scrypted/types';
import { computed, ref, useSlots, watch } from 'vue';
import { SettingsGroup, SettingsSubgroup } from '../settings-common';
import SplatSetting from './SplatSetting.vue';
import { TrackedSetting } from './setting-modelvalue';
import { isDark } from '@/common/colors';
import { getFaPrefix } from '@/device-icons';

const slots = useSlots();
const dark = isDark();

const totalExpansionPanels = computed(() => {
  let ret = settingsGroups.value?.length || 0;
  if (slots['settings-expansion-panels'])
    ret++;
  return ret;
});

function getTitle(title: string) {
  return title || 'General';
}

const modelValue = defineModel<TrackedSetting[]>();
const props = defineProps<{
  extraGroups?: SettingsGroup[];
  hideBorder?: boolean;
}>();

const emits = defineEmits<{
  (event: 'click-button-setting', setting: Setting): void;
}>();

function makeGroups(settings: Setting[], groupKey: 'group' | 'subgroup') {
  if (!settings)
    return [];
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
  const grouped = makeGroups(modelValue.value, 'group');
  const subgrouped: SettingsGroup[] = grouped.map(group => {
    return {
      title: group.title,
      subgroups: makeGroups(group.settings, 'subgroup'),
    };
  });
  return subgrouped;
});

const selectedSettingGroup = ref<SettingsGroup>(settingsGroups.value?.[0]);
watch(() => settingsGroups.value, () => {
  if (props.extraGroups?.includes(selectedSettingGroup.value))
    return;
  selectedSettingGroup.value = settingsGroups.value.find(v => v.title === selectedSettingGroup.value?.title)
    || settingsGroups.value[0] || props.extraGroups?.[0];
});

const selectedSettingSubgroup = ref<SettingsSubgroup>(settingsGroups.value?.[0]?.subgroups?.[0]);
watch(() => selectedSettingGroup.value, () => {
  selectedSettingSubgroup.value = selectedSettingGroup.value?.subgroups.find(v => v.title === selectedSettingSubgroup.value?.title)
    || selectedSettingGroup.value?.subgroups[0];
});
</script>
