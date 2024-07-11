import { Setting } from "@scrypted/types";

export function getChipVariant(): 'flat' | undefined | 'tonal' {
  return 'flat';
}

export const chipColor = "light-blue-darken-3";

export interface SettingsSubgroup {
  title: string;
  settings: Setting[];
}

export interface SettingsGroup{
  title: string;
  subgroups: SettingsSubgroup[];
}
