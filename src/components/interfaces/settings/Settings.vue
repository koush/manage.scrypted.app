<template>
  <div ref="root">
    <v-expansion-panels flat density="compact" v-model="selectedSettingGroup" variant="accordion"
      :mandatory="totalExpansionPanels <= 1">

      <template v-for="group in settingsGroups">
        <v-expansion-panel :value="group" :collapse-icon="getFaPrefix('fa-caret-up')"
          :expand-icon="getFaPrefix('fa-caret-down')">
          <v-expansion-panel-title v-if="totalExpansionPanels > 1"
            style="min-height: unset; height: 24px; font-size: .8rem; font-weight: 450; text-transform: uppercase;"
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
              <div class="mb-2"></div>
              <template v-for="setting in selectedSettingSubgroup?.settings">
                <SettingRow v-if="isRadioSettingVisible(setting)" :title="wide ? setting.title || '' : undefined"
                  :description="setting.type !== 'boolean' && (!setting.multiple || setting.choices) ? setting.description : undefined">
                  <SplatSetting :model-value="setting" @click-button-setting="emits('click-button-setting', setting)"
                    :class="getClass(setting)" :hide-title="wide" :disabled="isRadioSettingDisabled(setting)">
                    {{ setting.title }}
                  </SplatSetting>
                </SettingRow>
              </template>
              <div class="mb-4"></div>
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
import SettingRow from './SettingRow.vue';
import { observeResize } from '@/common/resize-observer';
import { isTouchPhone } from '@/common/size';

const slots = useSlots();
const dark = isDark();

const root = ref<HTMLElement>();
const rootSize = observeResize(root);

const wide = computed(() => {
  if (isTouchPhone.value)
    return false;
  return rootSize.value.width > 480;
});

function getClass(setting: Setting) {
  const ret: string[] = [];
  if (setting.radioGroups) {
    ret.push('ml-4');
    ret.push('mr-4');
  }
  if (setting.type === 'radiopanel' && wide) {
    ret.push('mt-4');
  }

  return ret.join(' ');
}

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

const allRadioButtons = computed(() => {
  const ret = new Set<string>();
  for (const setting of modelValue.value) {
    if (setting.type !== 'radiobutton')
      continue;
    if (!isRadioSettingVisible(setting))
      continue;
    for (const choice of setting.choices) {
      ret.add(choice);
      ret.add(setting.title + ':' + choice);
    }
  }
  return [...ret];
})

const enabledRadioButtons = computed(() => {
  const ret = new Set<string>();
  for (const setting of modelValue.value) {
    if (setting.type === 'radiobutton') {
      // only the matching radio buttons are active
      ret.add(setting.value as string);
      ret.add(setting.title + ':' + setting.value);
    }
  }
  return [...ret];
});

const invisibleRadioSettings = computed(() => {
  const ret = new Set<string>();
  for (const setting of modelValue.value) {
    if (setting.type === 'radiopanel') {
      for (const choice of setting.choices) {
        // only the active panel is visible
        if (choice !== setting.value) {
          ret.add(choice);
          ret.add(setting.title + ':' + choice);
        }
      }
    }
  }

  // now that we have a list of radio panel items that are invisible,
  // keep traversing the list adding children to the list.

  let lastSize: number;
  do {
    lastSize = ret.size;
    for (const setting of modelValue.value) {
      if (setting.radioGroups && (setting.type === 'radiobutton' || setting.type === 'radiopanel')) {
        for (const radioGroup of setting.radioGroups) {
          if (ret.has(radioGroup)) {
            // this radio group is invisible, so add all the children
            for (const choice of setting.choices) {
              ret.add(choice);
              ret.add(setting.title + ':' + choice);
            }
          }
        }
      }
    }
  }
  while (lastSize !== ret.size);

  return [...ret];
});

function isRadioSettingVisible(setting: Setting) {
  if (!setting.radioGroups)
    return true;
  for (const radioGroup of setting.radioGroups) {
    if (!invisibleRadioSettings.value.includes(radioGroup))
      return true;
  }
  return false;
}

function isRadioSettingDisabled(setting: Setting) {
  if (!setting.radioGroups)
    return;
  let isInRadioGroup = false;
  for (const radioGroup of setting.radioGroups) {
    if (enabledRadioButtons.value.includes(radioGroup))
      return false;
    isInRadioGroup ||= allRadioButtons.value.includes(radioGroup);
  }

  return isInRadioGroup;
}
</script>
