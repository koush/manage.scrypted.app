<template>
  <v-card>
    <template v-slot:title>
      <div style="display: flex;">
        <v-card-subtitle class="mr-4">Script</v-card-subtitle>
        <ToolbarTooltipButton icon="fa-play" tooltip="Run" variant="text" size="x-small" @click="run">
        </ToolbarTooltipButton>
        <ToolbarTooltipButton icon="fa-save" tooltip="Save" variant="text" size="x-small" @click="save">
        </ToolbarTooltipButton>
      </div>
    </template>

    <div ref="container" style="height: 640px; width: 100%;"></div>
  </v-card>
</template>
<script setup lang="ts">
import { isDark } from '@/common/colors';
import { getDeviceFromId } from '@/id-device';
import { Scriptable, ScriptSource } from '@scrypted/types';
import { onUnmounted, ref, watch } from 'vue';
import ToolbarTooltipButton from '../ToolbarTooltipButton.vue';
import type * as MonacoType from 'monaco-editor';

const monaco = await import('monaco-editor');

const props = defineProps<{
  id: string;
}>();

const emits = defineEmits<{
  (event: 'run'): void;
}>();

const device = getDeviceFromId<Scriptable>(() => props.id);

function run() {
  if (!device.value || !currentEditor)
    return;
  emits('run');
  scriptsSource.script = currentEditor.getValue();
  device.value.eval(scriptsSource);
}

async function save() {
  if (!device.value || !currentEditor)
    return;
  scriptsSource.script = currentEditor.getValue();
  device.value.saveScript(scriptsSource);
}

const container = ref<HTMLDivElement>();
let currentEditor: MonacoType.editor.IStandaloneCodeEditor;
let model: MonacoType.editor.ITextModel

onUnmounted(() => {
  currentEditor?.dispose();
  model?.dispose();
});

let scriptsSource: ScriptSource & { filename: string };
async function loadScript() {
  const scripts = await device.value?.loadScripts();
  scriptsSource = {
    filename: Object.keys(scripts)[0],
    ...scripts[Object.keys(scripts)[0]],
  }
  return scriptsSource;
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
    monaco.Uri.parse(`${props.id}-${scriptSource.filename}`),
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
