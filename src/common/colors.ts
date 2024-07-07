import { computed } from "vue";
import { useTheme } from "vuetify";

export function getTextHintColor() {
    const globalTheme = useTheme().global.name;
    return computed(() => {
         if (globalTheme.value === 'dark')
            return '#B0B0B0';
        return '#B0B0B0';
    })
};

export function getLineHintColor() {
    const globalTheme = useTheme().global.name;
    return computed(() => {
        if (globalTheme.value === 'dark')
            return '#808080';
        return '#e0e0e0';
    })
};

export function isDark() {
  const theme = useTheme();
  return computed(() => {
    const globalTheme = theme.global.name;
    return globalTheme.value === 'dark'
  });
}
