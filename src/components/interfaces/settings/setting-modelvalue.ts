import { Setting, SettingValue } from '@scrypted/types';
import { ModelRef, watch } from 'vue';

export function watchModelValue(modelValue: ModelRef<Setting, string>) {
  watch(() => modelValue.value.value, () => {
    modelValue.value = modelValue.value;
  });
}

export interface TrackedSetting extends Setting {
  originalValue?: SettingValue;
  getDeviceTitle?: (id: string) => string;
}

// various plugins aren't using StorageSettings and are returning stringified values.
export function normalizeBoolean(value: any) {
  if (value === 'true')
    return true;
  if (value === 'false')
    return false;
  return !!value;
}

export function normalizeNumber(value: any) {
  return parseFloat(value);
}
