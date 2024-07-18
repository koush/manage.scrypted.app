import { isDark } from "@/common/colors";
import { Setting } from "@scrypted/types";
import { computed } from "vue";

export function getChipVariant() {
  const dark = isDark();
  return computed(() => {
    return !dark.value ? 'tonal' : 'flat';
  });
}

export function getButtonVariant() {
  const dark = isDark();
  return computed(() => {
    return dark.value ? 'outlined' : 'outlined';
  });
}

export const chipColor = "light-blue-darken-3";

export interface SettingsSubgroup {
  title: string;
  settings: Setting[];
}

export interface SettingsGroup {
  title: string;
  subgroups: SettingsSubgroup[];
}
