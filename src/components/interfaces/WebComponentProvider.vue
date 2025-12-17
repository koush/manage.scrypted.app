<template>
  <v-card>
    <template v-if="webComponentClass?.layout !== 'frameless'" v-slot:title>
      <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
        {{ webComponentClass?.title || 'Web Component' }}
      </v-card-subtitle>
    </template>

    <div ref="containerRef" :style="containerStyle">
      <!-- Web component will be mounted here -->
    </div>

    <v-alert v-if="error" color="error" class="ma-4">{{ error }}</v-alert>
  </v-card>
</template>

<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectedClient } from '@/common/client';
import { getDeviceFromId } from '@/util/id-device';
import { ScryptedInterfaceDescriptor, ScryptedInterfaceDescriptors } from '@scrypted/types';
import { computed, onUnmounted, ref, watch } from 'vue';

interface WebComponentClass {
    name: string;
    scripts?: string[];
    styles?: string[];

    title?: string;
    height?: string;
    layout?: "frame" | "frameless";
}

interface WebComponentProvider {
    getWebComponentClass(): Promise<WebComponentClass>;
}

const props = defineProps<{
    id: string;
}>();

const device = getDeviceFromId<WebComponentProvider>(() => props.id);

// Register the interface descriptor
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

// Web component state
const containerRef = ref<HTMLElement>();
const componentName = ref<string>();
const error = ref<string>();
const injectedElements = ref<HTMLElement[]>([]);

// Load web component class definition
const webComponentClass = asyncComputed({
    async get() {
        try {
            const data = await device.value.getWebComponentClass();
            componentName.value = data.name;
            return data;
        }
        catch (e) {
            error.value = (e as Error).message;
            throw e;
        }
    },
    watch: {
        device: () => device.value,
    }
});

// Compute container style based on height property
const containerStyle = computed(() => {
    if (webComponentClass.value?.height) {
        return {
            height: webComponentClass.value.height,
            width: '100%',
        };
    }
    return {
        width: '100%',
        height: '100%',
    };
});

// Watch for web component class changes and inject/mount
watch(() => webComponentClass.value, async (data: WebComponentClass | undefined) => {
    if (!data)
        return;

    try {
        error.value = undefined;

        // Clean up previous injections
        for (const element of injectedElements.value) {
            element.remove();
        }
        injectedElements.value = [];

        // Inject styles as links
        if (data.styles) {
            for (const styleUrl of data.styles) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = styleUrl;
                document.head.appendChild(link);
                injectedElements.value.push(link);
            }
        }

        // Inject scripts as external scripts
        if (data.scripts) {
            for (const scriptUrl of data.scripts) {
                const script = document.createElement('script');
                script.src = scriptUrl;
                document.head.appendChild(script);
                injectedElements.value.push(script);
            }
        }

        // Create and mount the web component
        if (containerRef.value && data.name) {
            const element = document.createElement(data.name);
            containerRef.value.innerHTML = '';
            containerRef.value.appendChild(element);
        }
    } catch (e) {
        console.error('web component load error', e);
        error.value = (e as Error).message;
    }
}, { immediate: true });

onUnmounted(() => {
    // Clean up container
    if (containerRef.value) {
        containerRef.value.innerHTML = '';
    }

    // Remove injected styles and scripts from document head
    for (const element of injectedElements.value) {
        element.remove();
    }
    injectedElements.value = [];
});
</script>
