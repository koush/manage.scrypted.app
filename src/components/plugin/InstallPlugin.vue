<template>
  <v-container fluid>
    <v-row>
      <ResponsiveColumn cols="12" md="8" lg="6">
        <v-card text="Search for Plugins created by Scrypted and other developers.">
          <template v-slot:prepend>
            <v-icon size="x-small">{{ getFaPrefix('fa-puzzle-piece') }}</v-icon>
          </template>
          <template v-slot:title>
            <v-card-subtitle class="mt-1">Install Plugins</v-card-subtitle>
          </template>
          <template v-slot:append>
            <v-btn size="x-small" variant="flat" color="info" :prepend-icon="getFaPrefix('fa-puzzle')"
              to="/component/plugin" class="mr-2">View Current Plugins</v-btn>
          </template>

          <v-text-field v-model="search" density="compact" variant="outlined" class="ma-4" label="Search Plugins"
            persistent-placeholder hint="Keywords. E.g. Hikvision, Unifi, Ring, etc." persistent-hint></v-text-field>
        </v-card>
        <v-card v-for="plugin in plugins" class="mt-4">
          <template v-slot:prepend>
            <v-icon color="info" size="x-small" :icon="getFaPrefix('fa-puzzle-piece')"></v-icon>
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
            <v-btn variant="outlined" color="info" size="x-small" prepend-icon="fab fa-npm" :href="plugin.link"
              target="_blank">View
              On NPM</v-btn>
            <v-btn variant="flat" color="deep-purple-accent-4" size="x-small" :prepend-icon="getFaPrefix('fa-download')"
              @click="install(plugin)">Install</v-btn>
          </v-card-actions>
        </v-card>
        <v-dialog v-model="installingDialog" max-width="400">
          <v-card :title="installFailure ? 'Plugin Install Failed' : 'Installing Plugin'">
            <template v-slot:append>
              <v-progress-circular v-if="!installFailure" size="x-small" indeterminate class="ma-8">
              </v-progress-circular>
              <v-icon color="error" v-else>{{ getFaPrefix('fa-circle-exclamation') }}</v-icon>
            </template>

            <v-card-text>
              <div style="white-space: pre-wrap;">
                {{ installingText }}
              </div>
            </v-card-text>
            <v-card-actions v-if="installFailure">
              <v-spacer>
              </v-spacer>
              <v-btn variant="text" color="info" @click="installingDialog = false">Cancel</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </ResponsiveColumn>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { getFaPrefix } from '@/util/device-icons';
import { sleep } from '@scrypted/common/src/sleep';
import { ref } from 'vue';
import { installPlugin } from '../../util/internal-apis';
import { connectedClient } from '@/common/client';
import { goDevice } from '@/util/id-device';
import { useRoute, useRouter } from 'vue-router';
import ResponsiveColumn from '../ResponsiveColumn.vue';

const route = useRoute();
const search = ref<string>(route.query.search as string || '');

interface Plugin {
  name: string;
  description: string;
  version: string;
  username: string;
  date: string;
  link: string;
  keywords: string[];
};

const plugins = asyncComputed({
  async get({ isCancelled }) {

    await sleep(500);
    if (isCancelled())
      return;

    let url = 'https://registry.npmjs.org/-/v1/search?text=keywords:scrypted';
    if ((search.value?.length || 0) > 2)
      url += `+${search.value}`;
    const response = await fetch(url);
    const json = await response.json();
    const results = (json.objects as any[]).map(o => ({
      description: o.package.description?.replace(' for Scrypted', ''),
      name: o.package.name,
      version: o.package.version,
      username: o.package.publisher.username,
      date: new Date(o.package.date).toLocaleDateString(),
      link: o.package.links.npm,
      keywords: o.package.keywords,
    } satisfies Plugin));

    // npm search returns valid candidates but the score and order seems totally whackadoo
    const keywords = search.value?.split(' ') || [];
    results.sort((a, b) => {
      let ascore = 0;
      let bscore = 0;

      for (const keyword of keywords) {
        if (a.keywords.includes(keyword))
          ascore++;
        if (b.keywords.includes(keyword))
          bscore++;

        if (a.name.includes(keyword))
          ascore++;
        if (b.name.includes(keyword))
          bscore++;
        if (a.description?.includes(keyword))
          ascore++;
        if (b.description?.includes(keyword))
          bscore++;

        return bscore - ascore;
      }
    });

    return results;
  },
  default(previousValue) {
    return previousValue || [] as Plugin[];
  },
  watch: {
    search: () => search.value,
  }
});

const installingDialog = ref(false);
const installingText = ref<string>();
const installFailure = ref(false);
const router = useRouter();
async function install(plugin: Plugin) {
  try {
    installingText.value = `Installing ${plugin.name}...`;
    installFailure.value = false;
    installingDialog.value = true;

    await installPlugin(plugin.name);
    const id = connectedClient.value.systemManager.getDeviceById(plugin.name);
    goDevice(router, id);
    installingDialog.value = false;
  }
  catch (e) {
    installFailure.value = true;
    installingText.value = `${plugin.name} failed to install.\n\n${(e as Error).message}`;
  }
}
</script>
