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
import { Setting } from '@scrypted/types';
import { onUnmounted, ref, watch } from 'vue';
import { getLineHintColor, isDark } from '@/common/colors';
import type * as MonacoType from 'monaco-editor';

const monaco = await import('monaco-editor');

const lineHintColor = getLineHintColor();

const modelValue = defineModel<Setting>();

const container = ref<HTMLDivElement>();
let currentEditor: MonacoType.editor.IStandaloneCodeEditor;
let model: MonacoType.editor.ITextModel

onUnmounted(() => {
  currentEditor?.dispose();
  model?.dispose();
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
  model?.dispose();

  model = monaco.editor.createModel(
    modelValue.value?.value?.toString() || '',
    'typescript',
    monaco.Uri.parse('scriptsetting.ts'),
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

  currentEditor.onDidChangeModelContent(e=> {
    modelValue.value.value = currentEditor.getValue();
  });

  const f = eval(monacoEvalDefaults);
  f(monaco);
}

watch(() => container.value, createEditor);
</script>
<script lang="ts">
import { createMonacoEvalDefaultsWithLibs, ScryptedLibs, StandardLibs } from '@scrypted/common/src/eval/monaco-libs';

// do this for every file in ScryptedLibs
// @ts-ignore
import global from '@types/node/globals.d.ts?raw'
// @ts-ignore
import buffer from '@types/node/buffer.d.ts?raw';
// @ts-ignore
import process from '@types/node/process.d.ts?raw';
// @ts-ignore
import events from '@types/node/events.d.ts?raw';
// @ts-ignore
import stream from '@types/node/stream.d.ts?raw';
// @ts-ignore
import fs from '@types/node/fs.d.ts?raw';
// @ts-ignore
import net from '@types/node/net.d.ts?raw';
// @ts-ignore
import child_process from '@types/node/child_process.d.ts?raw';

const standardLibs: StandardLibs = {
  "@types/node/globals.d.ts": global,
  "@types/node/buffer.d.ts": buffer,
  "@types/node/process.d.ts": process,
  "@types/node/events.d.ts": events,
  "@types/node/stream.d.ts": stream,
  "@types/node/fs.d.ts": fs,
  "@types/node/net.d.ts": net,
  "@types/node/child_process.d.ts": child_process,
};

// do this for every file in ScryptedLibs
// @ts-ignore
import settingsMixin from '../../../../node_modules/@scrypted/sdk/dist/src/settings-mixin.d.ts?raw';
// @ts-ignore
import storageSettings from '../../../../node_modules/@scrypted/sdk/dist/src/storage-settings.d.ts?raw';
// @ts-ignore
import index from '../../../../node_modules/@scrypted/sdk/dist/src/index.d.ts?raw';
// @ts-ignore
import types from '../../../../node_modules/@scrypted/types/dist/index.d.ts?raw';

const scryptedLibs: ScryptedLibs = {
  '@types/sdk/index.d.ts': index,
  '@types/sdk/settings-mixin.d.ts': settingsMixin,
  '@types/sdk/storage-settings.d.ts': storageSettings,
  '@types/sdk/types.d.ts': types,
};

const monacoEvalDefaults = createMonacoEvalDefaultsWithLibs(standardLibs, scryptedLibs, {});

</script>
<style scoped>
.shrink {
  transform: scale(.75, .75);
  width: 120%;
  transform-origin: 0% 50%;
}
</style>
