<template>
    <v-tooltip text="Toggle Theme" location="top" :open-delay="1000">
        <template v-slot:activator="{ props }">

            <v-btn variant="text" @click="toggleTheme" v-bind="props" v-if="theme === 'light'">
                <v-icon>{{ getFaPrefix('fa-moon') }}</v-icon>
            </v-btn>
            <v-btn variant="text" @click="toggleTheme" v-bind="props" v-else-if="theme === 'dark'">
                <v-icon>{{ getFaPrefix('fa-moon-over-sun') }}</v-icon>
            </v-btn>
            <v-btn variant="text" @click="toggleTheme" v-bind="props" v-else>
                <v-icon>{{ getFaPrefix('fa-sun-bright') }}</v-icon>
            </v-btn>
        </template>
    </v-tooltip>
</template>
<script setup lang="ts">
import { getFaPrefix } from '../fa-prefix';
import { getThemeManager } from '../theme';

const tm = getThemeManager();

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
