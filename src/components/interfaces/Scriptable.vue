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
    <v-alert v-if="chatCompletions.length === 0" type="info" class="ma-2" density="compact" style="font-size: .8rem;">
      Install the LLM plugin to use AI to create scripts.
    </v-alert>
    <v-text-field v-else v-model="userPrompt" :disabled="loading" density="compact" variant="outlined"
      placeholder="Create a script that..." persistent-hint class="mr-2 ml-2 mb-2" @keydown.enter="sendPrompt">
      <template v-slot:prepend>
        <v-menu>
          <template v-slot:activator="{ props: menuProps }">
            <v-btn variant="text" size="small" v-bind="menuProps">
              {{ selectedChatCompletion?.name || 'Select AI' }}
              <v-icon end>{{ getFaPrefix('fa-chevron-down') }}</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-for="chat in chatCompletions" :key="chat.id" :value="chat.id"
              @click="selectedChatCompletionId = chat.id">
              <v-list-item-title>{{ chat.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
      <template v-slot:append-inner>
        <v-btn class="pa-0 inner-btn" variant="text" @click="sendPrompt" :disabled="loading" :loading="loading" :color="loading ? 'info' : undefined">
          <v-icon v-if="!loading">{{ getFaPrefix('fa-brain-circuit') }}</v-icon>
        </v-btn>
      </template>

    </v-text-field>
    <v-alert v-if="llmMessage" type="info" class="mr-2 ml-2 mb-2" density="compact" closable @click:close="llmMessage = ''">
      {{ llmMessage }}
    </v-alert>
    <div ref="container" style="height: 640px; width: 100%;"></div>
  </v-card>
</template>
<script setup lang="ts">
import { isDark } from '@/common/colors';
import { getDeviceFromId } from '@/util/id-device';
import { ChatCompletion, Scriptable, ScriptSource, ScryptedInterface } from '@scrypted/types';
import type * as MonacoType from 'monaco-editor';
import { computed, onUnmounted, ref, watch } from 'vue';
import ToolbarTooltipButton from '../ToolbarTooltipButton.vue';
import { getFaPrefix } from '@/common/fa-prefix';
import { getAllDevices } from '@/common/devices';
import PROMPT from '../../scripts/PROMPT.md?raw';
import TYPINGS from '../../scripts/sdk-types-trimmed.d.ts?raw';

const monaco = await import('monaco-editor');

const props = defineProps<{
  id: string;
}>();

const emits = defineEmits<{
  (event: 'run'): void;
}>();

const device = getDeviceFromId<Scriptable>(() => props.id);

const chatCompletions = computed(() =>
  getAllDevices<ChatCompletion>().filter(d => d.interfaces.includes(ScryptedInterface.ChatCompletion))
);

const selectedChatCompletionId = ref<string>();
const selectedChatCompletion = computed(() =>
  chatCompletions.value.find(c => c.id === selectedChatCompletionId.value)
);

const userPrompt = ref('');
const loading = ref(false);
const llmMessage = ref('');

function assembleSystemPrompt(): string {
  const parts: string[] = [];

  // Add PROMPT.md first
  parts.push(PROMPT);

  // Add SDK type definitions
  parts.push('---');
  parts.push('');
  parts.push('# SDK Type Definitions');
  parts.push('');
  parts.push('The following TypeScript definitions are available globally in the script context. NO IMPORTS ARE NEEDED - these types are automatically available.');
  parts.push('');
  parts.push('```typescript');
  parts.push(TYPINGS);
  parts.push('```');

  return parts.join('\n');
}

watch(chatCompletions, (completions) => {
  if (!selectedChatCompletionId.value && completions.length > 0) {
    selectedChatCompletionId.value = completions[0].id;
  }
}, { immediate: true });

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

async function sendPrompt() {
  if (!selectedChatCompletion.value || !userPrompt.value.trim() || !currentEditor) return;

  loading.value = true;
  const prompt = userPrompt.value;
  userPrompt.value = '';

  try {
    const currentScript = currentEditor.getValue();
    const scriptMessage = currentScript.trim()
      ? `Here is the user's code file:\n\`\`\`\n${currentScript}\n\`\`\``
      : "The user's code file is currently empty.";

    const response = await selectedChatCompletion.value.getChatCompletion({
      messages: [
        { role: 'system', content: assembleSystemPrompt() },
        { role: 'system', content: scriptMessage },
        { role: 'system', content: 'You must end your response by calling either the write_script_file tool to write the script, or the show_message tool to respond to the user or report any issues.' },
        { role: 'user', content: prompt }
      ],
      model: undefined,
      tools: [
        {
          type: 'function',
          function: {
            name: 'write_script_file',
            description: 'Write or update the script file content',
            parameters: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'The complete script content to write'
                }
              },
              required: ['content']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'show_message',
            description: 'Show a message to the user. Use this to respond to the user, report unclear or invalid instructions, potentially destructive requests, or any situation where you cannot safely complete the requested task. Keep the message to no more than 2 sentences.',
            parameters: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'The message to display to the user (max 2 sentences)'
                }
              },
              required: ['message']
            }
          }
        }
      ]
    });

    console.log(response);

    const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.type === 'function' && toolCall?.function?.name === 'write_script_file') {
      const args = JSON.parse(toolCall.function.arguments);
      if (args.content !== undefined) {
        currentEditor.setValue(args.content);
        await save();
        run();
      }
    } else if (toolCall?.type === 'function' && toolCall?.function?.name === 'show_message') {
      const args = JSON.parse(toolCall.function.arguments);
      if (args.message) {
        llmMessage.value = args.message;
      }
    } else {
      llmMessage.value = 'LLM did not return a valid response. No tool was called or an invalid tool was used.';
    }
  } finally {
    loading.value = false;
  }
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
:deep(.v-field__input) {
  font-size: .8rem;
}
</style>
