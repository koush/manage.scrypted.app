<template>
  <div class="mb-4">
    <v-divider class="mt-2 mb-2"></v-divider>
    <v-list-item-subtitle class="shrink ml-3 mr-3 mb-3" v-if="modelValue.title">{{
      modelValue.title }}</v-list-item-subtitle>
    <div ref="container" style="height: 320px; width: 100%; border-width: 1px; border-style: solid;"
      :style="`border-color: ${lineHintColor}`"></div>
  </div>
</template>
<script setup lang="ts">
import { getLineHintColor, isDark } from '@/common/colors';
import { Setting } from '@scrypted/types';
import type * as MonacoType from 'monaco-editor';
import { onUnmounted, ref, watch } from 'vue';

const monaco = await import('monaco-editor');

const lineHintColor = getLineHintColor();

const modelValue = defineModel<Setting>();

const container = ref<HTMLDivElement>();
let currentEditor: MonacoType.editor.IStandaloneCodeEditor;
let model: MonacoType.editor.ITextModel

onUnmounted(() => {
  currentEditor?.dispose();
});

const dark = isDark();
watch(() => dark.value, () => {
  currentEditor.updateOptions({
    theme: dark.value ? "vs-dark" : "vs",
  });
});

async function createEditor() {
  if (!container.value)
    return;

  currentEditor?.dispose();
  currentEditor = undefined;

  const uri = monaco.Uri.parse('scriptsetting.ts');
  model = monaco.editor.getModel(uri) || monaco.editor.createModel(
    modelValue.value?.value?.toString() || '',
    'typescript',
    uri,
  );

  currentEditor = monaco.editor.create(container.value, {
    theme: dark.value ? "vs-dark" : "vs",
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
    fontSize: 10,
    model,
  });

  currentEditor.onDidChangeModelContent(e => {
    modelValue.value.value = currentEditor.getValue();
  });

  const f = eval(await monacoEvalDefaults);
  f(monaco);
}

watch(() => container.value, createEditor);
</script>
<script lang="ts">
import type { ScryptedLibs, StandardLibs } from '@scrypted/common/src/eval/monaco-libs';

interface RawModule {
  default: string;
}

async function main() {
  const { createMonacoEvalDefaultsWithLibs } = await import('@scrypted/common/src/eval/monaco-libs');

  // do this for every file in ScryptedLibs
  // @ts-ignore
  const global = import('@types/node/globals.d.ts?raw') as Promise<RawModule>;
  // @ts-ignore
  const buffer = import('@types/node/buffer.d.ts?raw') as Promise<RawModule>;
  // @ts-ignore
  const process = import('@types/node/process.d.ts?raw') as Promise<RawModule>;
  // @ts-ignore
  const events = import('@types/node/events.d.ts?raw') as Promise<RawModule>;
  // @ts-ignore
  const stream = import('@types/node/stream.d.ts?raw') as Promise<RawModule>;
  // @ts-ignore
  const fs = import('@types/node/fs.d.ts?raw') as Promise<RawModule>;
  // @ts-ignore
  const net = import('@types/node/net.d.ts?raw') as Promise<RawModule>;
  // @ts-ignore
  const child_process = import('@types/node/child_process.d.ts?raw') as Promise<RawModule>;

  const standardLibs: StandardLibs = {
    "@types/node/globals.d.ts": (await global).default,
    "@types/node/buffer.d.ts": (await buffer).default,
    "@types/node/process.d.ts": (await process).default,
    "@types/node/events.d.ts": (await events).default,
    "@types/node/stream.d.ts": (await stream).default,
    "@types/node/fs.d.ts": (await fs).default,
    "@types/node/net.d.ts": (await net).default,
    "@types/node/child_process.d.ts": (await child_process).default,
  };

  // do this for every file in ScryptedLibs
  // @ts-ignore
  const settingsMixin = import('../../../../node_modules/@scrypted/sdk/dist/src/settings-mixin.d.ts?raw') as Promise<RawModule>;
  // @ts-ignore
  const storageSettings = import('../../../../node_modules/@scrypted/sdk/dist/src/storage-settings.d.ts?raw') as Promise<RawModule>;
  // @ts-ignore
  const index = import('../../../../node_modules/@scrypted/sdk/dist/src/index.d.ts?raw') as Promise<RawModule>;
  // @ts-ignore
  const types = import('../../../../node_modules/@scrypted/types/dist/index.d.ts?raw') as Promise<RawModule>;

  const scryptedLibs: ScryptedLibs = {
    '@types/sdk/index.d.ts': (await index).default,
    '@types/sdk/settings-mixin.d.ts': (await settingsMixin).default,
    '@types/sdk/storage-settings.d.ts': (await storageSettings).default,
    '@types/sdk/types.d.ts': (await types).default,
  };

  const monacoEvalDefaults = createMonacoEvalDefaultsWithLibs(standardLibs, scryptedLibs, {});
  return monacoEvalDefaults;
}

const monacoEvalDefaults = main();

window.MonacoEnvironment = {
  getWorkerUrl: function (workerId, label) {
    const baseUrl = new URL(document.baseURI);
    baseUrl.search = '';
    baseUrl.hash = '';
    const baseUrlWorker = new URL('vs/base/worker/workerMain.js', baseUrl);
    return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
              self.MonacoEnvironment = { baseUrl: '${baseUrl}' };
              importScripts('${baseUrlWorker}');
          `)}`;
  }
};
</script>
<style scoped>
.shrink {
  transform: scale(.75, .75);
  width: 120%;
  transform-origin: 0% 50%;
}
</style>
