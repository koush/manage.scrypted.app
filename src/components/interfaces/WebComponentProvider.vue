<template>
    <div>{{ contents }}</div>
</template>

<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectedClient } from '@/common/client';
import { getDeviceFromId } from '@/util/id-device';
import { ScryptedInterfaceDescriptor, ScryptedInterfaceDescriptors } from '@scrypted/types';
import { watch } from 'vue';

interface WebComponentClass {
    getWebComponentClass(): Promise<string>;
}

const props = defineProps<{
    id: string;
}>();

const device = getDeviceFromId<WebComponentClass>(() => props.id);

async function register() {
    if (!connectedClient.value)
        return;
    const { systemManager } = connectedClient.value;
    const descriptors: { [key: string]: ScryptedInterfaceDescriptor } = {
        ...ScryptedInterfaceDescriptors,
        "WebComponentProvider": {
            "name": "WebComponentProvider",
            "methods": [
                "getWebComponentClass"
            ],
            "properties": []
        }
    };
    await (systemManager as any).setScryptedInterfaceDescriptors(undefined, descriptors).catch(() => { });
}

watch(() => connectedClient.value, register);
register();

const contents = asyncComputed({
    async get() {
        try {
            return await device.value.getWebComponentClass();
        }
        catch (e) {
            throw e;
        }
    },
    watch: {
        device: () => device.value,
    }
});
</script>
