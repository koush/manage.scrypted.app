<template>
  <v-card title="Script">
    <div ref="container" style="height: 640px; width: 100%;"></div>

    <!-- <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" @click="emits('click:cancel')"></v-btn>
      <v-btn v-if="useId" text="Add" @click="emits('click:create', useId, settings)" color="success"></v-btn>
    </v-card-actions> -->
  </v-card>
</template>
<script setup lang="ts">
import { isDark } from '@/common/colors';
import { getDeviceFromId } from '@/id-device';
import { Scriptable } from '@scrypted/types';
import * as monaco from 'monaco-editor';
import { onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
  id: string;
}>();

const device = getDeviceFromId<Scriptable>(() => props.id);

const container = ref<HTMLDivElement>();
let currentEditor: monaco.editor.IStandaloneCodeEditor;
let model: monaco.editor.ITextModel

onUnmounted(() => {
  currentEditor?.dispose();
  model?.dispose();
});

async function loadScript() {
  const scripts = await device.value?.loadScripts();
  console.log(scripts);
  return {
    filename: Object.keys(scripts)[0],
    ...scripts[Object.keys(scripts)[0]],
  }
}

const dark = isDark();
watch(() => dark.value, () => {
  currentEditor.updateOptions({
    theme: dark.value ? "vs-dark" : "vs",
  });
});

async function createEditor() {
  if (!container.value)
    return;

  if (!device.value)
    return;

  const scriptSource = await loadScript();

  currentEditor?.dispose();
  currentEditor = undefined;
  model?.dispose();

  model = monaco.editor.createModel(
    scriptSource.script,
    scriptSource.language,
    monaco.Uri.parse(scriptSource.filename),
  );

  currentEditor = monaco.editor.create(container.value, {
    theme: dark.value ? "vs-dark" : "vs",
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
    model,
  });

  const f = eval(scriptSource.monacoEvalDefaults?.toString() || "");
  f(monaco);
}

watch(() => container.value, createEditor);
watch(() => device.value, createEditor);

</script>
<script lang="ts">
window.MonacoEnvironment = {
  getWorkerUrl: function (workerId, label) {
    return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
              self.MonacoEnvironment = { baseUrl: '${window.location.origin}/' };
              importScripts('${window.location.origin}/vs/base/worker/workerMain.js');
          `)}`;
  }
};
</script>
