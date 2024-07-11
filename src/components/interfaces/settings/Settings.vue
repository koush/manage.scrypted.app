<template>
  <div
    :style="true || hideBorder ? undefined : `border: 1px solid ${lineHintColor}; border-radius: 16px; overflow: hidden;`">
    <v-expansion-panels flat density="compact" v-model="selectedSettingGroup" variant="accordion"
      :mandatory="settingsGroups?.length <= 1">

      <template v-for="group in settingsGroups">
        <v-expansion-panel :value="group">
          <v-expansion-panel-title style="min-height: unset;"
            :color="group?.title === selectedSettingGroup?.title ? 'deep-purple' : undefined">{{
              getTitle(group.title) }}</v-expansion-panel-title>

          <v-chip-group v-if="group.title === selectedSettingGroup?.title && group.subgroups?.length > 1"
            style="width: 100%; background: rgb(var(--v-theme-surface-variant));" v-model="selectedSettingSubgroup"
            column class="pt-0 pb-0" mandatory variant="flat">
            <template v-for="subgroup of group.subgroups">
              <v-chip :value="subgroup" color="deep-purple-accent-4" size="small" rounded="0" class="ma-0">{{
                getTitle(subgroup.title) }}</v-chip>
            </template>
          </v-chip-group>

          <v-expansion-panel-text>
            <template
              v-if="selectedSettingGroup?.title === group.title && group.subgroups.find(check => check.title === selectedSettingSubgroup?.title)">
              <template v-for="setting in selectedSettingSubgroup.settings">
                <SplatSetting :model-value="setting" @click-button-setting="emits('click-button-setting', setting)">
                </SplatSetting>
              </template>
            </template>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-divider></v-divider>
      </template>

      <slot name="settings-expansion-panels" :selectedSettingGroup="selectedSettingGroup"></slot>

    </v-expansion-panels>
  </div>
</template>
<script setup lang="ts">
import { getLineHintColor } from '@/common/colors';
import { Setting } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
import SplatSetting from './SplatSetting.vue';
import { TrackedSetting } from './setting-modelvalue';
import { SettingsGroup, SettingsSubgroup } from '../settings-common';

const lineHintColor = getLineHintColor();

function getTitle(title: string) {
  return title || 'General';
}

const modelValue = defineModel<TrackedSetting[]>();
const props = defineProps<{
  extraGroups?: string[];
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
  if (props.extraGroups?.includes(selectedSettingGroup.value?.title))
    return;
  selectedSettingGroup.value = settingsGroups.value.find(v => v.title === selectedSettingGroup.value?.title)
    || settingsGroups.value[0];
});

const selectedSettingSubgroup = ref<SettingsSubgroup>(settingsGroups.value?.[0]?.subgroups?.[0]);
watch(() => selectedSettingGroup.value, () => {
  selectedSettingSubgroup.value = selectedSettingGroup.value?.subgroups.find(v => v.title === selectedSettingSubgroup.value?.title)
    || selectedSettingGroup.value?.subgroups[0];
});
</script>
