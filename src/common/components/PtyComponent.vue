<template>
  <v-card style="height: 100%; display: flex; flex-direction: column;">
    <template v-if="icon" v-slot:prepend>
      <v-icon size="small" :icon="getFaPrefix(icon)"></v-icon>
    </template>
    <template v-slot:append>
      <ToolbarTooltipButton v-if="copyButton" icon="fa-copy" tooltip="Copy Log" variant="text" @click="copyLog" />
      <ToolbarTooltipButton v-if="copyButton" icon="fa-broom-wide" tooltip="Clear Log" color="error" variant="text"
        @click="clear" />
      <template v-if="expandButton !== false">
        <ToolbarTooltipButton v-if="!expanded" icon="fa-chevrons-down" tooltip="Expand" variant="text"
          @click="expand" />
        <ToolbarTooltipButton v-else icon="fa-chevrons-up" tooltip="Shrink" variant="text" @click="contract" />
      </template>
      <ToolbarTooltipButton v-if="close" icon="fa-close" tooltip="Close" variant="text" @click="emits('close')" />
    </template>
    <template v-slot:title>
      <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">{{ title }}</v-card-subtitle>
    </template>
    <div class="ml-3 mr-3" ref="terminal" style="flex: 1; min-height: 0;"></div>
  </v-card>
</template>
<script setup lang="ts">
import { connectPluginClient, connectedClient } from '@/common/client';
import { isDark } from '@/common/colors';
import { observeResize } from '@/common/resize-observer';
import { getFaPrefix } from "@/common/device-icons";
import { createAsyncQueue, createAsyncQueueFromGenerator } from "@scrypted/common/src/async-queue";
import { Deferred } from "@scrypted/common/src/deferred";
import { sleep } from "@scrypted/common/src/sleep";
import { DeviceProvider, ScryptedNativeId, StreamService } from '@scrypted/types';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import debounce from 'lodash/debounce';
import { onUnmounted, ref, watch } from 'vue';
import ToolbarTooltipButton from '@/common/components/ToolbarTooltipButton.vue';

const props = defineProps<{
  title: string;
  pluginId?: string;
  nativeId?: ScryptedNativeId;
  hello?: string;
  control?: boolean;
  reconnect?: boolean;
  expandButton?: boolean;
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
function getTheme() {
  return dark.value
    ? undefined
    : {
      selectionBackground: '#0000ff55',
      foreground: "black",
      background: "white",
      cursor: "black",
    };
}

const term = new Terminal({
  theme: getTheme(),
  convertEol: true,
  fontSize: 12,
});

watch(() => dark.value, () => {
  term.options.theme = getTheme();
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

const terminalResize = debounce(() => fitAddon.fit(), 50);
const terminalSize = observeResize(terminal);
watch(() => terminalSize.value, terminalResize);

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
unmounted.promise.then(() => {
  window.removeEventListener('resize', terminalResize);
});

let localQueue: ReturnType<typeof createAsyncQueueFromGenerator>;
let currentDataQueue: ReturnType<typeof createAsyncQueue<Buffer>>;

type OutputListener = (data: Buffer) => void;
const outputListeners = new Set<OutputListener>();

async function sendCommand(command: string, timeoutMs = 60000): Promise<string> {
  if (!currentDataQueue) {
    throw new Error('Terminal is not connected');
  }

  const uuid = Math.random().toString(16).substring(2, 6);
  const startSentinel = `--agent-start-${uuid}--`;
  const endSentinel = `--agent-end-${uuid}--`;
  const startSentinelHex = `\\x2d\\x2dagent-start\\x2d${uuid}\\x2d\\x2d`;
  const endSentinelHex = `\\x2d\\x2dagent-end\\x2d${uuid}\\x2d\\x2d`;
  const escapedSentinel = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const extractPattern = new RegExp(`${escapedSentinel(startSentinel)}(?:\\r?\\n)?([\\s\\S]*?)(?:\\r?\\n)?${escapedSentinel(endSentinel)}`);
  const escapedCommand = command.replace(/'/g, "'\\''");

  const collected: Buffer[] = [];
  const done = new Deferred<string>();
  let foundStart = false;

  const listener: OutputListener = (data: Buffer) => {
    collected.push(data);
    const text = Buffer.concat(collected).toString('utf8');
    if (text.includes(startSentinel)) {
      foundStart = true;
    }
    if (foundStart && text.includes(endSentinel)) {
      done.resolve(text);
    }
  };
  outputListeners.add(listener);

  const timeout = setTimeout(() => {
    done.reject(new Error(`Command timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  try {
    currentDataQueue.enqueue(Buffer.from(`printf '${startSentinelHex}\\n'; printf '%s' '${escapedCommand}' | $SHELL; printf '${endSentinelHex}\\n'\n`, 'utf8'));

    const rawOutput = await done.promise;

    const match = rawOutput.match(extractPattern);
    const cleaned = match ? match[1] : rawOutput;
    return cleaned.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim();
  }
  finally {
    clearTimeout(timeout);
    outputListeners.delete(listener);
  }
}

async function sendCtrlC(): Promise<void> {
  if (!currentDataQueue) {
    throw new Error('Terminal is not connected');
  }
  currentDataQueue.enqueue(Buffer.from('\x03', 'utf8'));
}

defineExpose({
  sendCommand,
  sendCtrlC,
});

function refreshOnUpdate() {
  localQueue?.end();
  localQueue = undefined;
  if (!props.reconnect)
    connectPty();
}

watch(() => props.hello, refreshOnUpdate);
watch(() => props.pluginId, refreshOnUpdate);
watch(() => props.nativeId, refreshOnUpdate);

async function connectPty() {
  buffer = [];

  const dataQueue = createAsyncQueue<Buffer>();
  currentDataQueue = dataQueue;
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

  const _data = term.onData(data => dataQueueEnqueue(Buffer.from(data, 'utf8')));
  const _binary = term.onBinary(data => dataQueueEnqueue(Buffer.from(data, 'binary')));
  const _resize = term.onResize(dim => {
    ctrlQueue.enqueue({ dim });
    dataQueue.enqueue(Buffer.alloc(0));
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

    const streamDevice = systemManager.getDeviceById<StreamService<Buffer | string, Buffer>>(props.pluginId || "@scrypted/core", props.nativeId);
    const streamSvc = streamDevice.providerId ? await systemManager.getDeviceById<DeviceProvider>(streamDevice.providerId).getDevice(props.nativeId) as StreamService<Buffer | string, Buffer> : streamDevice;
    const streamSvcDirect = await connectRPCObject(streamSvc);
    const remoteGenerator = await streamSvcDirect.connectStream(localQueue.queue as AsyncGenerator<Buffer | string>, props.options);

    for await (const message of remoteGenerator) {
      if (!message) {
        break;
      }
      const b = Buffer.from(message);
      if (props.copyButton) {
        buffer.push(b);
      }
      for (const listener of outputListeners) {
        listener(b);
      }
      term.write(new Uint8Array(message));
    }

  }
  finally {
    _data.dispose();
    _binary.dispose();
    _resize.dispose();
    if (!props.reconnect)
      return;
    await sleep(1000);
    if (unmounted.finished)
      return;
    connectPty();
  }
}

function copyLog() {
  const text = Buffer.concat(buffer).toString();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
  else {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}
</script>
