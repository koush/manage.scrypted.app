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
  const ret = parseFloat(value);
  if (Number.isNaN(ret))
    return undefined;
  return ret;
}

export function normalizeSetting(setting: TrackedSetting) {
  if (setting.type === 'boolean')
    setting.value = normalizeBoolean(setting.value);
  else if (setting.type === 'number')
    setting.value = normalizeNumber(setting.value);
  return setting;
}

export function trackSetting(setting: Setting) {
  normalizeSetting(setting);
  const adjusted: TrackedSetting = {
      ...setting,
      originalValue: setting.value,
  };
  return adjusted;
}

export function isDirty(setting: TrackedSetting) {
  return JSON.stringify(normalizeSetting(setting).value) !== JSON.stringify(normalizeSetting(setting).originalValue);
}
