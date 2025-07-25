import { ref } from "vue";
import { useTheme } from "vuetify";

export function getThemeManager() {

    const theme = ref<string | undefined>();
    const usedTheme = useTheme();
    const globalTheme = usedTheme.global.name;

    function setTheme(theme?: string) {
        if (theme)
            localStorage.setItem('globalTheme', theme);
        else
            localStorage.removeItem('globalTheme');
        updateTheme();
    }

    function updateTheme() {
        const themeValue = localStorage.getItem('globalTheme');
        if (themeValue === 'light' || themeValue === 'dark') {
            usedTheme.change(themeValue);
        }
        else {
            const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (dark)
                usedTheme.change('dark');
            else
                usedTheme.change('light');
        }
        theme.value = themeValue || undefined;
    }

    theme.value = localStorage.getItem('globalTheme') || undefined;

    function getThemeName() {
        if (theme.value === 'light')
            return 'Light';
        if (theme.value === 'dark')
            return 'Dark';
        return 'System Default';
    }

    function getThemes() {
        return [
            {
                id: undefined,
                text: 'System Default',
            }, {
                id: 'light',
                text: 'Light',
            },
            {
                id: 'dark',
                text: 'Dark',
            }
        ]
    }

    return {
        getThemes,
        getThemeName,
        theme,
        globalTheme,
        setTheme,
        updateTheme,
    }
}
