<template>
    <v-tooltip text="Toggle Theme" location="top" :open-delay="1000">
        <template v-slot:activator="{ props }">
            <v-fade-transition leave-absolute>
                <v-btn :icon="icon" variant="text" @click="toggleTheme" v-bind="props" v-if="theme === 'light'">
                    <v-icon :size="iconSize">{{ getFaPrefix('fa-sun-bright') }}</v-icon>
                </v-btn>
                <v-btn :icon="icon" variant="text" @click="toggleTheme" v-bind="props" v-else-if="theme === 'dark'">
                    <v-icon :size="iconSize">{{ getFaPrefix('fa-moon') }}</v-icon>
                </v-btn>
                <v-btn :icon="icon" variant="text" @click="toggleTheme" v-bind="props" v-else>
                    <v-icon :size="iconSize">{{ getFaPrefix('fa-moon-over-sun') }}</v-icon>
                </v-btn>
            </v-fade-transition>
        </template>
    </v-tooltip>
</template>
<script setup lang="ts">
import type { IconValue } from 'vuetify/lib/composables/icons.mjs';
import { getFaPrefix } from '../fa-prefix';
import { getThemeManager } from '../theme';

const tm = getThemeManager();

defineProps<{
    icon?: boolean | IconValue,
    iconSize?: string | number,
}>();

const { theme } = tm;
function toggleTheme() {
    if (theme.value === 'light')
        tm.setTheme('dark');
    else if (theme.value === 'dark')
        tm.setTheme();
    else
        tm.setTheme('light');
}

</script>
