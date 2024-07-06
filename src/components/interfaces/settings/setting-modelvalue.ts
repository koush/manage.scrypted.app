import { Setting, SettingValue } from '@scrypted/types';
import { ModelRef, watch } from 'vue';

export function watchModelValue(modelValue: ModelRef<Setting, string>) {
  watch(() => modelValue.value.value, () => {
    modelValue.value = modelValue.value;
  });
}

export interface TrackedSetting extends Setting {
  originalValue?: SettingValue;
}
