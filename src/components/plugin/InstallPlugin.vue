<template>

  <v-col cols="12" md="8" lg="6">
    <v-card text="These plugins are currently installed in Scrypted." :prepend-icon="getFaPrefix('fa-puzzle-piece')"
      title="Install Plugins">
      <v-text-field v-model="search" density="compact" variant="outlined" class="ma-4" label="Search Plugins"
        persistent-placeholder hint="Keywords. E.g. Hikvision, Unifi, Ring, etc." persistent-hint></v-text-field>
    </v-card>
    <v-card v-for="plugin in plugins" class="mt-4">
      <template v-slot:prepend>
        <v-icon color="info" size="small" :icon="getFaPrefix('fa-puzzle-piece')"></v-icon>
      </template>
      <template v-slot:append>
        <div style="text-align: end">v{{ plugin.version }}</div>
      </template>
      <template v-slot:title>
        <v-card-title>{{ plugin.name }}
        </v-card-title>
      </template>
      <v-card-text>{{ plugin.description }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="deep-purple-accent-4" size="small"
          :prepend-icon="getFaPrefix('fa-download')">Install</v-btn>
        <v-btn variant="outlined" color="info" size="small" prepend-icon="fab fa-npm" :href="plugin.link"
          target="_blank">View
          On NPM</v-btn>
      </v-card-actions>
    </v-card>
  </v-col>

</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { getFaPrefix } from '@/device-icons';
import { sleep } from '@scrypted/common/src/sleep';
import { ref } from 'vue';

const search = ref<string>();

interface Plugin {
  name: string;
  description: string;
  version: string;
  package: string;
  date: string;
  npm: string;
  link: string;
};

const plugins = asyncComputed({
  async get({ isCancelled }) {

    await sleep(500);
    if (isCancelled())
      return;

    let url = 'https://registry.npmjs.org/-/v1/search?text=keywords:scrypted';
    if ((search.value?.length || 0) > 3)
      url += `+${search.value}`;
    const response = await fetch(url);
    const json = await response.json();
    return json.objects.map((o: any) => ({
      description: o.package.description.replace(' for Scrypted', ''),
      name: o.package.name,
      version: o.package.version,
      package: o.package.publisher.username,
      date: new Date(o.package.date).toLocaleDateString(),
      link: o.package.links.npm,
    })) as Plugin[];
  },
  default(previousValue) {
    return previousValue || [] as Plugin[];
  },
  watch: {
    search: () => search.value,
  }
});

</script>
