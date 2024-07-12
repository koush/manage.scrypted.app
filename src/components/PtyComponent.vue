<template>
  <v-card>
    <template v-if="icon" v-slot:prepend>
      <v-icon size="small" :icon="getFaPrefix(icon)"></v-icon>
    </template>
    <template v-slot:append>
      <ToolbarTooltipButton v-if="!expanded" icon="fa-chevrons-down" tooltip="Expand" variant="text" @click="expand" />
      <ToolbarTooltipButton v-else icon="fa-chevrons-up" tooltip="Expand Log" variant="text" @click="contract" />
      <ToolbarTooltipButton icon="fa-copy" tooltip="Copy Log" variant="text" />
      <ToolbarTooltipButton icon="fa-broom-wide" tooltip="Clear Log" color="error" variant="text" @click="clear" />
      <ToolbarTooltipButton v-if="close" icon="fa-close" tooltip="Close" variant="text" @click="emits('close')" />
    </template>
    <template v-slot:title>
      <v-card-subtitle>{{ title }}</v-card-subtitle>
    </template>
    <div class="ml-3 mr-3" ref="terminal"></div>
  </v-card>
</template>
<script setup lang="ts">
import { connectPluginClient, connectedClient } from '@/common/client';
import { isDark } from '@/common/colors';
import { getFaPrefix } from "@/device-icons";
import { createAsyncQueue, createAsyncQueueFromGenerator } from "@scrypted/common/src/async-queue";
import { Deferred } from "@scrypted/common/src/deferred";
import { sleep } from "@scrypted/common/src/sleep";
import { DeviceProvider, StreamService } from '@scrypted/types';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { onUnmounted, ref, watch } from 'vue';
import ToolbarTooltipButton from './ToolbarTooltipButton.vue';

const props = defineProps<{
  title: string;
  nativeId: string;
  hello?: string;
  control?: boolean;
  reconnect?: boolean;
  copyButton?: boolean;
  options?: any;
  icon?: string;
  close?: boolean;
}>();

const emits = defineEmits<{
  (event: 'clear'): void;
  (event: 'close'): void;
}>();

const expanded = ref(false);
function expand() {
  expanded.value = true;
  term.resize(term.cols, term.rows * 2.5);
}
function contract() {
  expanded.value = false;
  term.resize(term.cols, term.rows / 2.5);
}

function clear() {
  term.clear();
  buffer = [];
  emits('clear');
}

const terminal = ref<HTMLElement>();

const dark = isDark();
const term = new Terminal({
  theme: dark.value
    ? undefined
    : {
      selectionBackground: '#0000ff55',
      foreground: "black",
      background: "white",
      cursor: "black",
    },
  convertEol: true,
  fontSize: 12,
});
watch(() => dark.value, () => {
  term.options.theme = dark.value
    ? undefined
    : {
      selectionBackground: '#0000ff55',
      foreground: "black",
      background: "white",
      cursor: "black",
    };
});
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

watch(() => terminal.value, () => {
  if (!terminal.value)
    return;
  term.open(terminal.value);
  fitAddon.fit();
  connectPty();
});

let buffer: Buffer[] = [];

const unmounted = new Deferred<void>();
onUnmounted(() => unmounted.resolve());

let localQueue: ReturnType<typeof createAsyncQueueFromGenerator>;

watch(() => props.hello, () => {
  localQueue?.end();
  localQueue = undefined;
  if (!props.reconnect)
    connectPty();
});

async function connectPty() {
  buffer = [];

  const dataQueue = createAsyncQueue<Buffer>();
  unmounted.promise.then(() => dataQueue.end());

  if (props.hello) {
    const hello = Buffer.from(props.hello, 'utf8');
    dataQueue.enqueue(hello);
  }

  const ctrlQueue = createAsyncQueue();
  if (!props.control)
    ctrlQueue.end();

  ctrlQueue.enqueue({ interactive: true });
  ctrlQueue.enqueue({ dim: { cols: term.cols, rows: term.rows } });

  let bufferedLength = 0;
  const MAX_BUFFERED_LENGTH = 64000;
  async function dataQueueEnqueue(data: Buffer) {
    bufferedLength += data.length;
    const promise = dataQueue.enqueue(data).then(() => bufferedLength -= data.length);
    if (bufferedLength >= MAX_BUFFERED_LENGTH) {
      term.options.disableStdin = true;
      await promise;
      if (bufferedLength < MAX_BUFFERED_LENGTH)
        term.options.disableStdin = false;
    }
  }

  term.onData(data => dataQueueEnqueue(Buffer.from(data, 'utf8')));
  term.onBinary(data => dataQueueEnqueue(Buffer.from(data, 'binary')));
  term.onResize(dim => {
    ctrlQueue.enqueue({ dim });
    ctrlQueue.enqueue(Buffer.alloc(0));
  });

  async function* localGenerator() {
    while (true) {
      const ctrlBuffers = ctrlQueue.clear();
      if (ctrlBuffers.length) {
        for (const ctrl of ctrlBuffers) {
          yield JSON.stringify(ctrl);
        }
        continue;
      }

      const dataBuffers = dataQueue.clear();
      if (dataBuffers.length === 0) {
        const buf = await dataQueue.dequeue();
        if (buf.length)
          yield buf;
        continue;
      }

      const concat = Buffer.concat(dataBuffers);
      if (concat.length)
        yield concat;
    }
  }

  localQueue = createAsyncQueueFromGenerator(localGenerator());

  try {
    await connectPluginClient();

    const { systemManager, connectRPCObject } = connectedClient.value!;

    const termSvcRaw = systemManager.getDeviceByName<DeviceProvider>("@scrypted/core");
    const termSvc = await termSvcRaw.getDevice(props.nativeId) as StreamService;
    const termSvcDirect = await connectRPCObject(termSvc);
    const remoteGenerator = await termSvcDirect.connectStream(localQueue.queue, props.options);

    for await (const message of remoteGenerator) {
      if (!message) {
        break;
      }
      const b = Buffer.from(message);
      if (props.copyButton) {
        buffer.push(b);
      }
      term.write(new Uint8Array(message));
    }

  }
  finally {
    if (!props.reconnect)
      return;
    await sleep(1000);
    if (unmounted.finished)
      return;
    connectPty();
  }
}
</script>
