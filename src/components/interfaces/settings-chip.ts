import { isDark } from "@/common/colors";
import { computed } from "vue";

export function getChipVariant() {
  const dark = isDark();
  const chipVariant = computed<'flat' | undefined>(() => {
    return dark.value ? 'flat' : undefined;
  });

  return chipVariant;
}
