<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12" md="6">
                <SettingsInterface v-model="settings"></SettingsInterface>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectPluginClient, connectedClient } from '@/common/client';
import { getAllDevices } from '@/common/devices';
import { ScryptedInterface, ScryptedSystemDevice, Setting, Settings } from '@scrypted/types';
import SettingsInterface from './interfaces/settings/Settings.vue';

const settings = asyncComputed({
    async get() {
        const { systemManager } = connectedClient.value || await connectPluginClient();
        const all = getAllDevices<Settings & ScryptedSystemDevice>(systemManager)
            .filter(d => d.interfaces.includes(ScryptedInterface.ScryptedSettings) || d.interfaces.includes("SystemSettings"))
            .map(async d => {
                const name = d.systemDevice?.settings || d.name;
                let settings: Setting[];
                try {
                    settings = await d.getSettings();
                }
                catch (e) {
                    settings = [
                        {
                            title: `${name} Settings Failure`,
                            description: 'Settings failed to load.'
                        }
                    ];
                }

                return settings.map(setting => ({
                    ...setting,
                    group: name,
                    subgroup: setting.group,
                } as Setting));
            });

        const stacked = await Promise.all(all);
        return stacked.flat();
    },
    default: [],
})

</script>
