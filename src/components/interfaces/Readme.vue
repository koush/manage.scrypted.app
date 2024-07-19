<template>
  <v-card>
    <template v-slot:prepend>
      <v-icon size="xx-small">{{ getFaPrefix('fa-database') }}</v-icon>
    </template>
    <template v-slot:title>
      <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
        Readme
      </v-card-subtitle>
    </template>
    <div class="ml-8 mr-8 mb-8" v-html="innerHtml"></div>
  </v-card>
</template>
<script setup lang="ts">
import markdownit from 'markdown-it';
import { Readme } from '@scrypted/types';
import { getDeviceFromId } from '@/id-device';
import { asyncComputed } from '@/common/async-computed';
import { getFaPrefix } from '@/device-icons';
import { getLineHintColor } from '@/common/colors';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';

hljs.registerLanguage('typescript', typescript);

const props = defineProps<{
  id: string;
}>();

const device = getDeviceFromId<Readme>(() => props.id);

// Actual default values
const mdit = markdownit('commonmark', {
  html: true,
  linkify: true,
  typographer: true,
  highlight(str: string, lang: string, attrs: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre><code class="hljs">' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>';
      } catch (__) { }
    }

    return '<pre><code class="hljs">' + mdit.utils.escapeHtml(str) + '</code></pre>';
  }
});

const innerHtml = asyncComputed({
  async get() {
    const md = await device.value.getReadmeMarkdown();
    const ret = mdit.render(md);
    return ret;
  },
  default: '',
  watch: {
    device: () => device.value,
  },
});

const lineHintColor= getLineHintColor();
</script>
<style scoped>
:deep(ul),
:deep(ol) {
  margin-left: 24px;
  margin-bottom: 12px;
}

:deep(h1),
:deep(h2),
:deep(h3),
:deep(h4),
:deep(h5),
:deep(h6) {
  font-weight: 400;
  margin-bottom: 12px;
  margin-top: 12px;
}

:deep(code:not(.hljs)) {
  background-color: v-bind('lineHintColor');
  text-wrap: wrap;
}

:deep(img) {
  max-width: 100%;
}
</style>
