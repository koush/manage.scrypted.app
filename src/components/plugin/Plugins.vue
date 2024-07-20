<template>
  <v-container fluid>
    <v-alert v-if="error" closable color="error" :icon="getFaPrefix('fa-circle-exclamation')" class="mt-2 mb-4">{{ error
      }}</v-alert>
    <v-row>
      <v-col v-if="!mdAndUp" cols="12" md="6" lg="4">
        <InstallPluginCard></InstallPluginCard>
      </v-col>

      <v-col cols="12" md="6" lg="4">
        <v-card text="These plugins are currently installed in Scrypted." class="mb-4">
          <template v-slot:prepend>
            <v-icon size="x-small">{{ getFaPrefix('fa-puzzle') }}</v-icon>
          </template>
          <template v-slot:title>
            <v-card-subtitle class="mt-1">Plugins</v-card-subtitle>
          </template>

          <v-list>
            <v-list-item v-for="plugin in plugins" :to="`/device/${plugin.id}`">
              <template v-slot:prepend>
                <v-icon size="x-small">{{ getFaPrefix(typeToIcon(plugin.type)) }}</v-icon>
              </template>
              <template v-slot:append>
                <div style="display: flex; justify-content: end; align-items: end; flex-direction: column;">
                  <template v-if="plugin.updateAvailable !== undefined">
                    <v-btn v-if="plugin.updateAvailable" size="x-small" :prepend-icon="getFaPrefix('fa-download')"
                      color="info" @click.prevent="updatePlugin(plugin)" class="mb-1">Update</v-btn>
                    <v-list-item-subtitle v-else class="ml-2"
                      style="font-size: .8rem; text-align: end;">v{{
                        plugin.version
                      }}</v-list-item-subtitle>
                    <div v-if="plugin.info">
                      <v-chip v-if="!plugin.info.pid" size="x-small" variant="flat" color="red" text="Crashed"></v-chip>
                      <v-list-item-subtitle v-else class="ml-2"
                        style="font-size: .8rem; text-align: end;">pid: {{
                          plugin.info.pid
                        }}</v-list-item-subtitle>
                    </div>
                  </template>
                </div>
              </template>
              <v-list-item-title style="font-size: .8rem; font-weight: 500; text-transform: uppercase;">{{ plugin.name
                }}</v-list-item-title>
              <v-list-item-subtitle style="font-size: .8rem">{{ plugin.package }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>

        <PluginStats v-if="!mdAndUp" :plugins="plugins"></PluginStats>
      </v-col>

      <v-col v-if="mdAndUp" cols="12" md="6" lg="4">
        <InstallPluginCard class="mb-4"></InstallPluginCard>
        <PluginStats :plugins="plugins"></PluginStats>
      </v-col>

    </v-row>
  </v-container>

</template>

<script setup lang="ts">
import { connectedClient, connectPluginClient } from '@/common/client';
import { getAllDevices } from '@/common/devices';
import { getFaPrefix, typeToIcon } from '@/device-icons';
import { checkNpmUpdate } from '@/npm';
import { ScryptedInterface } from '@scrypted/types';
import { computed, reactive, ref } from 'vue';
import { useDisplay } from 'vuetify';
import InstallPluginCard from './InstallPluginCard.vue';
import { getPluginInfo, installPlugin } from '../../internal-apis';
import { PluginModel } from './plugin-common';
import PluginStats from './PluginStats.vue';

const error = ref<string>();

const { mdAndUp } = useDisplay();

const hasUpdate = new Map<string, boolean>();

const plugins = computed((ov: PluginModel[]) => {
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
      info: ov?.find(o => o.id === d.id)?.info,
    }));


  plugins.forEach(async plugin => {
    const status = await checkNpmUpdate(plugin.package, plugin.version);
    plugin.updateAvailable = !!status.updateAvailable;
    hasUpdate.set(plugin.id, !!status.updateAvailable);
  });

  plugins.forEach(async plugin => {
    plugin.info = await getPluginInfo(plugin.package);
  });

  return plugins as PluginModel[];
});

async function updatePlugin(plugin: typeof plugins.value[0]) {
  try {
    plugin.updateAvailable = undefined;
    await installPlugin(plugin.package);
    plugin.updateAvailable = false;
    hasUpdate.set(plugin.id, false);
  }
  catch (e) {
    plugin.updateAvailable = true;
    error.value = (e as any).message;
  }
}
</script>
