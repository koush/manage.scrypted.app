<template>
    <Device v-if="id" :id="id"></Device>
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectedClient, connectPluginClient } from '@/common/client';
import Device from './Device.vue';
import { ScryptedNativeId } from '@scrypted/types';

const props = defineProps<{
    nativeId: ScryptedNativeId;
}>();

const id = asyncComputed({
    async get() {
        const { systemManager } = connectedClient.value || await connectPluginClient();
        const users = systemManager.getDeviceById('@scrypted/core', props.nativeId);
        return users?.id;
    },
    default(previousValue) {
        return previousValue;
    },
    watch: {
        nativeId: () => props.nativeId,
    }
});
</script>