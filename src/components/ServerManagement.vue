<template>
  <v-card>
    <template v-slot:prepend>
      <v-icon size="xx-small">{{ getFaPrefix('fa-bars-progress') }}</v-icon>
    </template>
    <template v-slot:title>
      <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
        Server Management
      </v-card-subtitle>
    </template>
    <template v-slot:append>
      <v-card-subtitle>
        v{{ connectedClient?.serverVersion }}
      </v-card-subtitle>
    </template>
    <v-card-actions>
      <v-btn size="small" color="info" :href="backupUrl">Backup</v-btn>
      <v-btn size="small" color="success">Restore</v-btn>
      <v-spacer></v-spacer>

      <v-dialog max-width="320">
        <template v-slot:activator="{ props: activatorProps }">
          <v-btn size="small" color="error" v-bind="activatorProps" @click="restartStatus = prompt">Restart</v-btn>
        </template>

        <template v-slot:default="{ isActive }">
          <v-card>
            <template v-slot:title>
              <v-card-subtitle class="mt-1">Restart Server</v-card-subtitle>
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
              <v-btn color="error" @click="restart();">Restart</v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
    </v-card-actions>
  </v-card>

</template>
<script setup lang="ts">
import { connectedClient } from '@/common/client';
import { getFaPrefix } from '@/device-icons';
import { combineBaseUrl, getCurrentBaseUrl } from '@scrypted/client/src/index';
import { ref } from 'vue';

const baseUrl = getCurrentBaseUrl();
const backupUrl = combineBaseUrl(baseUrl, 'web/component/backup');

const prompt = "This action will restart the Scrypted service.";
const restartStatus = ref(prompt);

async function restart() {
  restartStatus.value = "Restarting...";
  const { systemManager } = connectedClient.value;
  const serviceControl = await systemManager.getComponent("service-control");
  // legacy command that exits npx scrypted.
  await serviceControl.exit().catch(() => { });
  await serviceControl.restart();
}
</script>
