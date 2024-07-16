<template>
  <v-card>
    <v-dialog max-width="320" v-model="restartDialog">
      <template v-slot:default="{ isActive }">
        <v-card>
          <template v-slot:title>
            <v-card-subtitle class="mt-1">{{ restartTitle }}</v-card-subtitle>
          </template>
          <template v-slot:prepend>
            <v-icon size="x-small" color="error">{{ getFaPrefix('fa-power-off') }}</v-icon>
          </template>
          <v-card-text>
            {{ restartStatus }}
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text="Cancel" @click="isActive.value = false"></v-btn>
            <v-btn color="error" @click="restartAction()">Restart</v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>

    <template v-slot:prepend>
      <v-icon size="xx-small">{{ getFaPrefix('fa-bars-progress') }}</v-icon>
    </template>
    <template v-slot:title>
      <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
        Server Management
      </v-card-subtitle>
    </template>
    <template v-slot:append>
      <v-card-subtitle v-if="!updateAvailable">
        v{{ connectedClient?.serverVersion }}
      </v-card-subtitle>
      <v-btn v-else size="x-small" :prepend-icon="getFaPrefix('fa-download')" color="info"
        @click="restartTitle = 'Update and Restart Server'; restartStatus = restartPrompt; restartAction = doUpdateAndRestart; restartDialog = true;"
        class="mb-1">Update</v-btn>

    </template>
    <v-card-actions>
      <v-btn size="small" color="info" :href="backupUrl">Backup</v-btn>
      <v-btn size="small" color="success">Restore</v-btn>
      <v-spacer></v-spacer>

      <v-btn size="small" color="error"
        @click="restartTitle = 'Restart Server'; restartStatus = restartPrompt; restartAction = restart; restartDialog = true;">Restart</v-btn>

    </v-card-actions>
  </v-card>

</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectedClient, connectPluginClient, fixupAppDomainLinkUrl, isScryptedCloudHostname } from '@/common/client';
import { getFaPrefix } from '@/device-icons';
import { combineBaseUrl, getCurrentBaseUrl } from '@scrypted/client/src/index';
import { ref } from 'vue';

const restartDialog = ref(false);

const baseUrl = getCurrentBaseUrl();
const backupUrl = isScryptedCloudHostname()
  ? fixupAppDomainLinkUrl('web/component/backup')
  : combineBaseUrl(baseUrl, 'web/component/backup');

const restartPrompt = "This action will restart the Scrypted service.";
const restartTitle = ref<string>();
const restartStatus = ref<string>();
let restartAction: () => Promise<void>;

async function restart() {
  restartStatus.value = "Restarting...";
  const { systemManager } = connectedClient.value || await connectPluginClient();
  const serviceControl = await systemManager.getComponent("service-control");
  // legacy command that exits npx scrypted.
  await serviceControl.exit().catch(() => { });
  await serviceControl.restart();
}

const updateAvailable = asyncComputed({
  async get() {
    const { systemManager } = connectedClient.value || await connectPluginClient();
    const serviceControl = await systemManager.getComponent("service-control");
    const info = await systemManager.getComponent("info");
    const scryptedEnv = await info.getScryptedEnv();

    // HA updates are handled by HA.
    if (scryptedEnv['SCRYPTED_INSTALL_ENVIRONMENT'])
      return false;

    return serviceControl.getUpdateAvailable();
  }
});

async function doUpdateAndRestart() {
  restartStatus.value = "Restarting...";
  const { systemManager } = connectedClient.value;
  const serviceControl = await systemManager.getComponent("service-control");
  await serviceControl.update();
}
</script>
