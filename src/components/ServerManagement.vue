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
      <v-card-subtitle v-if="!updateAvailable?.updateAvailable">
        v{{ connectedClient?.serverVersion }}
      </v-card-subtitle>
      <v-btn v-else size="x-small" :prepend-icon="getFaPrefix('fa-download')" color="info"
        @click="restartTitle = 'Update and Restart Server'; restartStatus = restartPrompt; restartAction = doUpdateAndRestart; restartDialog = true;"
        class="mb-1">Update</v-btn>

    </template>
    <v-card-actions>
      <v-btn size="small" color="info" :href="backupUrl">Backup</v-btn>
      <v-btn size="small" color="success" @click="restoreFile.click()">Restore</v-btn>
      <input type="file" ref="restoreFile" style="display: none;" @change="restore" />
      <v-spacer></v-spacer>

      <v-btn size="small" color="error"
        @click="restartTitle = 'Restart Server'; restartStatus = restartPrompt; restartAction = restart; restartDialog = true;">Restart</v-btn>

    </v-card-actions>
  </v-card>

</template>
<script setup lang="ts">
import { connectedClient, connectPluginClient, fixupAppDomainLinkUrl, isScryptedCloudHostname } from '@/common/client';
import { getFaPrefix } from '@/device-icons';
import { getServerUpdateMonitor } from '@/npm';
import { combineBaseUrl, getCurrentBaseUrl } from '@scrypted/client/src/index';
import { Settings } from '@scrypted/types';
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

const updateAvailable = getServerUpdateMonitor();

async function doUpdateAndRestart() {
  restartStatus.value = "Restarting...";
  const { systemManager } = connectedClient.value;
  const serviceControl = await systemManager.getComponent("service-control");
  if (updateAvailable.value?.SCRYPTED_INSTALL_ENVIRONMENT === 'lxc-docker') {
    const core = systemManager.getDeviceById<Settings>('@scrypted/core');
    await core.putSetting('pullImage', undefined);
    await serviceControl.restart();
  }
  await serviceControl.update();
}

const restoreFile = ref<HTMLInputElement>();

async function restore() {
  const file = restoreFile.value.files[0];
  if (!file)
    return;
  console.log(file);
  const fileBlob = new Blob([file]);
  const restoreUrl = isScryptedCloudHostname()
    ? fixupAppDomainLinkUrl('web/component/restore')
    : combineBaseUrl(baseUrl, 'web/component/restore');

  await fetch(restoreUrl, {
    method: 'POST',
    body: fileBlob,
  });
}
</script>
