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

async function loadKeys<T>(o: T) {
  const promises = (Object.keys(o) as (keyof T)[]).map(async k => {
    o[k] = await o[k];
  });
  await Promise.all(promises);
}

const monacoEvalDefaults = (async () => {
  const { createMonacoEvalDefaultsWithLibs } = await import('@scrypted/common/src/eval/monaco-libs');

  const standardLibs: StandardLibs = {
    "@types/node/globals.d.ts": undefined,
    "@types/node/buffer.d.ts": undefined,
    "@types/node/process.d.ts": undefined,
    "@types/node/events.d.ts": undefined,
    "@types/node/stream.d.ts": undefined,
    "@types/node/fs.d.ts": undefined,
    "@types/node/net.d.ts": undefined,
    "@types/node/child_process.d.ts": undefined,
  };

  loadKeys(standardLibs);

  const scryptedLibs: ScryptedLibs = {
    '@types/sdk/index.d.ts': undefined,
    '@types/sdk/settings-mixin.d.ts': undefined,
    '@types/sdk/storage-settings.d.ts': undefined,
    '@types/sdk/types.d.ts': undefined,
  };

  loadKeys(scryptedLibs);

  const monacoEvalDefaults = createMonacoEvalDefaultsWithLibs(standardLibs, scryptedLibs, {});
  return monacoEvalDefaults;
})();
</script>
<style scoped>
.shrink {
  transform: scale(.75, .75);
  width: 120%;
  transform-origin: 0% 50%;
}
</style>
