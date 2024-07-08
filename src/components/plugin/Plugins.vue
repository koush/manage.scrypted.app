<template>
  <v-container fluid>
    <v-alert v-if="error" color="error" :icon="getFaPrefix('fa-circle-exclamation')" class="mt-2 mb-4">{{ error
      }}</v-alert>
    <v-row>
      <InstallPluginCard v-if="!lgAndUp"></InstallPluginCard>

      <v-col cols="12" md="8" lg="6">
        <v-card text="These plugins are currently installed in Scrypted." :prepend-icon="getFaPrefix('fa-puzzle')"
          title="Plugins">
          <v-list>
            <v-list-item v-for="plugin in plugins" :to="`/device/${plugin.id}`">
              <template v-slot:prepend>
                <v-icon size="x-small">{{ getFaPrefix(typeToIcon(plugin.type)) }}</v-icon>
              </template>
              <template v-slot:append>
                <v-btn v-if="plugin.updateAvailable" size="x-small" :prepend-icon="getFaPrefix('fa-download')"
                  color="info" @click.prevent="updatePlugin(plugin)">Update</v-btn>
                <v-list-item-subtitle class="ml-2" style="width: 56px; text-align: end;">v{{ plugin.version
                  }}</v-list-item-subtitle>
              </template>
              <v-list-item-title>{{ plugin.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ plugin.package }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <InstallPluginCard v-if="lgAndUp"></InstallPluginCard>

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
import { installPlugin } from './plugin-apis';

const error = ref<string>();

const { lgAndUp } = useDisplay();

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
    }));


  plugins.forEach(async plugin => {
    const status = await checkNpmUpdate(plugin.package, plugin.version);
    plugin.updateAvailable = !!status.updateAvailable;
    hasUpdate.set(plugin.id, !!status.updateAvailable);
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
</script>
