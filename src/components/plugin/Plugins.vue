<template>
  <v-container fluid>
    <v-alert v-if="error" color="error" :icon="getFaPrefix('fa-circle-exclamation')" class="mt-2 mb-4">{{ error
      }}</v-alert>
    <v-row>
      <v-col v-if="!mdAndUp" cols="12" md="6" lg="4">
        <InstallPluginCard></InstallPluginCard>
      </v-col>

      <v-col cols="12" md="6" lg="4">
        <v-card text="These plugins are currently installed in Scrypted." :prepend-icon="getFaPrefix('fa-puzzle')"
          title="Plugins">
          <template v-slot:append>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn size="x-small" color="primary" v-bind="props">
                  View: {{ currentStat }}
                </v-btn>
              </template>
              <v-list>
                <v-list-item v-for="item in statItems" :key="item" :value="item" @click="currentStat = item">
                  <v-list-item-title>{{ item }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
          <v-list>
            <v-list-item v-for="plugin in plugins" :to="`/device/${plugin.id}`">
              <template v-slot:prepend>
                <v-icon size="x-small">{{ getFaPrefix(typeToIcon(plugin.type)) }}</v-icon>
              </template>
              <template v-slot:append>
                <div style="display: flex; justify-content: end; flex-direction: column;">
                  <v-btn v-if="plugin.updateAvailable" size="x-small" :prepend-icon="getFaPrefix('fa-download')"
                    color="info" @click.prevent="updatePlugin(plugin)" class="mb-1">Update</v-btn>

                  <v-list-item-subtitle v-else class="ml-2" style="font-size: .8rem; width: 64px; text-align: end;">v{{
                    plugin.version
                  }}</v-list-item-subtitle>
                  <div v-if="plugin.info">
                    <v-tooltip v-if="plugin.info" activator="parent" location="bottom">
                      <v-list class="ma-0 pa-0" width="160" theme="dark" style="background: transparent;">
                        <v-list-item v-for="key in statItems" :key="key">
                          <template v-slot:append>
                            <v-list-item-subtitle>{{ plugin.info[key] }}</v-list-item-subtitle>
                          </template>
                          <v-list-item-subtitle>{{ key }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-tooltip>
                    <v-chip v-if="!plugin.info.pid" size="x-small" variant="flat" color="red" text="Crashed"></v-chip>
                    <v-list-item-subtitle v-else class="ml-2" style="font-size: .8rem; width: 64px; text-align: end;">{{
                      toShort(currentStat) }}: {{
                        plugin.info[currentStat]
                      }}</v-list-item-subtitle>
                  </div>
                </div>
              </template>
              <v-list-item-title style="font-size: .8rem">{{ plugin.name }}</v-list-item-title>
              <v-list-item-subtitle style="font-size: .8rem">{{ plugin.package }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col v-if="mdAndUp" cols="12" md="6" lg="4">
        <InstallPluginCard></InstallPluginCard>
      </v-col>

    </v-row>
  </v-container>

</template>

<script setup lang="ts">
import { connectPluginClient, connectedClient } from '@/common/client';
import { getAllDevices } from '@/common/devices';
import { getFaPrefix, typeToIcon } from '@/device-icons';
import { checkNpmUpdate } from '@/npm';
import { ScryptedInterface } from '@scrypted/types';
import { computed, reactive, ref } from 'vue';
import { useDisplay } from 'vuetify';
import InstallPluginCard from './InstallPluginCard.vue';
import { getPluginInfo, installPlugin, PluginInfo } from './plugin-apis';

const error = ref<string>();

const { mdAndUp } = useDisplay();

const hasUpdate = new Map<string, boolean>();

const plugins = computed(() => {
  if (!connectedClient.value) {
    connectPluginClient();
    return [];
  }

  const all = getAllDevices();
  const plugins = all.filter(d => d.interfaces.includes(ScryptedInterface.ScryptedPlugin))
    .sort((a, b) => a.name!.localeCompare(b.name!)).map(d => reactive({
      id: d.id,
      name: d.name,
      package: d.info?.manufacturer,
      version: d.info?.version,
      type: d.type,
      updateAvailable: !!hasUpdate.get(d.id),
      info: undefined as PluginInfo,
    }));


  plugins.forEach(async plugin => {
    const status = await checkNpmUpdate(plugin.package, plugin.version);
    plugin.updateAvailable = !!status.updateAvailable;
    hasUpdate.set(plugin.id, !!status.updateAvailable);
  });

  plugins.forEach(async plugin => {
    plugin.info = await getPluginInfo(plugin.package);
  });

  return plugins;
});

async function updatePlugin(plugin: typeof plugins.value[0]) {
  try {
    await installPlugin(plugin.package);
    plugin.updateAvailable = false;
    hasUpdate.set(plugin.id, false);
  }
  catch (e) {
    error.value = (e as any).message;
  }
}

const statItems: (keyof PluginInfo)[] = ['pid', 'clientsCount', 'rpcObjects', 'pendingResults'];
const currentStat = ref(statItems[0]);

function toShort(stat: keyof PluginInfo) {
  switch (stat) {
    case 'pid':
      return 'pid';
    case 'clientsCount':
      return 'cc';
    case 'rpcObjects':
      return 'rpc';
    case 'pendingResults':
      return 'pr';
  }
  return stat;
}
</script>
