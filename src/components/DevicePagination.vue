<template>
    <v-chip-group class="ma-4" :model-value="selectedDeviceGroups" multiple column>
        <v-chip v-for="deviceGroup in deviceGroups" :key="deviceGroup"
            :prepend-icon="deviceGroup === other ? typeToIcon(ScryptedDeviceType.Unknown) : typeToIcon(deviceGroup)"
            size="small" :color="isDefaultFilter ? 'deep-purple-accent-4' : 'info'"
            @click="e => clickChip(deviceGroup, e)" variant="flat" :rounded="0" class="pl-3 ma-0"> {{
                deviceGroup
            }} ({{devices.filter(d => (hasFixedPhysicalLocation(d.type!) ? d.type : other) ===
                deviceGroup).length}})</v-chip>
    </v-chip-group>
    <v-text-field v-if="filteredDevices.length > pageSize" v-model="filterText" style="transform: scale(.75, .75)"
        title="Search" label="Search" density="compact"></v-text-field>
    <v-table density="compact" hover>
        <thead>
            <tr>
                <th style="width: 32px;"></th>
                <th class="text-left">
                    Name
                </th>
                <th class="text-left" v-if="mdAndUp && showDescription">Description</th>
                <th class="text-left" v-if="mdAndUp && showModel">Model</th>
                <th class="text-left" v-if="lgAndUp && showManufacturer">Manufacturer</th>
                <th class="text-left" v-if="mdAndUp && showIp">IP</th>
                <th class="text-left" v-if="mdAndUp && !hidePluginColumn">
                    Plugin
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="device in devicePage" :key="device.id || device.nativeId">
                <td><v-icon size="x-small">{{ typeToIcon(device.type) }}</v-icon></td>
                <td>
                    <v-btn style="width: 100%; justify-content: start;" size="small" variant="text"
                        :to="device.id ? getDeviceRoute(device.id) : undefined"
                        @click="device.id ? undefined : emits('click:device', device)"> {{ device.name }}</v-btn>
                </td>
                <td v-if="mdAndUp && showDescription">{{ device.info?.description }}</td>
                <td v-if="mdAndUp && showModel">{{ device.info?.model }}</td>
                <td v-if="lgAndUp && showManufacturer">{{ device.info?.manufacturer }}</td>
                <td v-if="mdAndUp && showIp">{{ device.info?.ip }}</td>
                <td v-if="mdAndUp && !hidePluginColumn"><v-btn v-if="getDevicePluginName(device as ScryptedDevice)"
                        color="info" size="small" variant="text" @click.stop
                        :to="getDevicePluginRoute(device as ScryptedDevice)">{{
                            getDevicePluginName(device as ScryptedDevice) }}</v-btn></td>
            </tr>
        </tbody>
    </v-table>
    <v-pagination :length="devicePages.length" v-model="page" rounded density="compact"></v-pagination>
</template>
<script setup lang="ts">
import { connectedClient } from '@/common/client';
import { hasFixedPhysicalLocation, typeToIcon } from '@/util/device-icons';
import { getDeviceRoute } from '@/util/id-device';
import { ScryptedDevice, ScryptedDeviceType } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { other } from './device-pagination';

const { lgAndUp, mdAndUp } = useDisplay();
const isDefaultFilter = ref(true);

const props = defineProps<{
    devices: Partial<ScryptedDevice>[];
    deviceGroups: string[];
    hidePluginColumn?: boolean;
    showPhysicalOnly?: boolean;
}>();

const emits = defineEmits<{
    (event: 'click:device', device: Partial<ScryptedDevice>): void;
}>();

function clickChip(deviceGroup: ScryptedDeviceType | string, e: MouseEvent | KeyboardEvent) {
    const i = props.deviceGroups.indexOf(deviceGroup);

    if (isDefaultFilter.value) {
        selectedDeviceGroups.value = [];
        isDefaultFilter.value = false;
        selectedDeviceGroups.value = [i];
        return;
    }

    if (selectedDeviceGroups.value.includes(i))
        selectedDeviceGroups.value = selectedDeviceGroups.value.filter(s => s !== i);
    else
        selectedDeviceGroups.value = [...selectedDeviceGroups.value, i];

    if (!selectedDeviceGroups.value.length) {
        isDefaultFilter.value = true;
        resetSelectedDeviceGroups();
    }
}

function getDevicePluginRoute(device: ScryptedDevice) {
    const id = connectedClient.value?.systemManager.getDeviceById(device.pluginId)?.id
    if (!id)
        return;
    return getDeviceRoute(id);
}


function getDevicePluginName(device: ScryptedDevice) {
    const devicePlugin = connectedClient.value?.systemManager.getDeviceById(device.pluginId);
    if (!devicePlugin)
        return '';
    return devicePlugin.name;
}

const selectedDeviceGroups = ref<number[]>([]);

function resetSelectedDeviceGroups() {
    selectedDeviceGroups.value = [];
    for (let i = 0; i < props.deviceGroups.length; i++) {
        const d = props.deviceGroups[i];
        if (!props.showPhysicalOnly || (d !== other && hasFixedPhysicalLocation(d))) {
            selectedDeviceGroups.value.push(i);
        }
    }
}

resetSelectedDeviceGroups();

watch(() => props.deviceGroups, () => {
    resetSelectedDeviceGroups();
});

const filterText = ref('');

const filteredDevices = computed(() => {
    return props.devices.filter(d => {
        if (!selectedDeviceGroups.value.length)
            return true;
        const group = hasFixedPhysicalLocation(d.type!) ? d.type : other;
        const index = props.deviceGroups.indexOf(group!);
        return selectedDeviceGroups.value.includes(index);
    });
});

const textFilteredDevices = computed(() => {
    const search = filterText.value.toLocaleLowerCase();
    const check = (text: string) => {
        return text?.toLocaleLowerCase().includes(search);
    }
    return filteredDevices.value.filter(d => {
        return check(d.name) || check(d.info?.ip) || check(d.info?.description) ||
            check(d.info?.manufacturer) || check(d.info?.model) ||
            d.interfaces?.find(i => check(i));
    });
});

const pageSize = 20;
const page = ref(1);

watch(() => selectedDeviceGroups.value, () => page.value = 1);

const devicePages = computed(() => {
    const pages: (typeof textFilteredDevices.value)[] = [];
    for (let i = 0; i < textFilteredDevices.value.length; i += pageSize) {
        pages.push(textFilteredDevices.value.slice(i, i + pageSize));
    }
    return pages;
});

const devicePage = computed(() => devicePages.value[page.value - 1]);

const showIp = computed(() => {
    return devicePage.value?.some(d => d.info?.ip);
});

const showManufacturer = computed(() => {
    return devicePage.value?.some(d => d.info?.manufacturer);
});

const showModel = computed(() => {
    return devicePage.value?.some(d => d.info?.model);
});

const showDescription = computed(() => {
    return (!showModel.value || !showManufacturer.value || !showIp.value) && devicePage.value?.some(d => d.info?.description);
});

</script>