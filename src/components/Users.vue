<template>
    <Device v-if="id" :id="id"></Device>
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectedClient, connectPluginClient } from '@/common/client';
import Device from './Device.vue';

const id = asyncComputed({
    async get() {
        const { systemManager } = connectedClient.value || await connectPluginClient();
        const users = systemManager.getDeviceById('@scrypted/core', 'users');
        return users?.id;
    },
    default(previousValue) {
        return previousValue;
    }
});
</script>