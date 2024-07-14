<template>
    <v-card>
        <template v-slot:title>
            <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
                Events
            </v-card-subtitle>
        </template>
        <template v-slot:append>
            <ToolbarTooltipButton icon="fa-close" tooltip="Close" variant="text" @click="emits('close')" />
        </template>

        <Pagination :items="logs" :page-size="20">
            <template v-slot:item="{ item: log }: { item: ScryptedLogEntry }">
                <div style="display: flex; font-size: .75rem;" class="mb-2">
                    <div style="width: 80px; display: flex; justify-content: end;" class="mr-2">
                        <v-chip size="x-small" variant="flat" style="width: 64px;" :color="levelToColor(log.level)">{{
                            new
                                Date(log.timestamp).toLocaleTimeString() }}
                        </v-chip>
                    </div>
                    <div style="flex: 1">
                        {{ log.message }}
                    </div>
                </div>
            </template>
        </Pagination>
    </v-card>
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectedClient } from '@/common/client';
import { getDeviceFromId, registerListener } from '@/id-device';
import Pagination from '../Pagination.vue';

const props = defineProps<{
    id: string;
}>();

const emits = defineEmits<{
    (event: 'close'): void;
}>();

const device = getDeviceFromId(() => props.id);

registerListener(device, {
    event: "Logger",
}, (eventSource, eventDetails, eventData) => {
    console.log(eventData);
});


interface ScryptedLogEntry {
    _id: string;
    timestamp: number;
    message: string;
    level: string,
}

function levelToColor(level: string) {
    switch (level) {
        case 'e':
            return 'error';
        case 'w':
            return 'warning';
        case 'a':
            return 'info';
    }
    return 'transparent';
}

const logs = asyncComputed({
    async get({ clearOldValue }, ov: ScryptedLogEntry[], nwv, owv, w) {
        if (!connectedClient.value)
            return ov as ScryptedLogEntry[];
        if (w === 'id')
            clearOldValue();
        const logger = await connectedClient.value.systemManager.getComponent('logger');
        const deviceLogger = await logger.getLogger('device');
        const device = await deviceLogger.getLogger(props.id);
        const logs = await device.getLogs();
        return logs.reverse() as ScryptedLogEntry[];
    },
    watch: {
        id: () => props.id,
        connectedClient: () => connectedClient.value,
    },
    default(pv: ScryptedLogEntry[]) {
        return pv as ScryptedLogEntry[];
    },
});
</script>
