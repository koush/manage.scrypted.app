<template>
  <v-container fluid>
    <v-row v-if="device">
      <v-col cols="12" md="4">
        <template v-if="device">
          <v-card class="mb-4">
            <template v-slot:prepend>
              <v-icon size="xx-small" :icon="typeToIcon(device.type)"></v-icon>
            </template>
            <template v-slot:append v-if="device.providerId && device.nativeId && mdAndUp">
              <v-btn class="mt-1" :to="`/device/${device.providerId}`" variant="text" density="compact">{{
                connectedClient?.systemManager.getDeviceById(device.providerId).name }}</v-btn>
            </template>
            <template v-slot:title>
              <div style="display: flex; align-items: center;" class="mt-1">
                <InlineTextField :model-value="device.name"></InlineTextField>
                <v-card-subtitle class="mt-1">ID: {{ device.id }}</v-card-subtitle>
              </div>
            </template>
            <template v-slot:subtitle>
            </template>
            <v-card-actions>
              <v-btn class="ml-1" size="small" color="info" @click="showConsole = !showConsole">Console</v-btn>
              <ToolbarTooltipButton icon="fa-clock-rotate-left" tooltip="Events"></ToolbarTooltipButton>
              <ToolbarTooltipButton icon="fa-rectangle-terminal" tooltip="REPL" @click="showRepl = !showRepl">
              </ToolbarTooltipButton>
              <v-spacer></v-spacer>
              <ToolbarTooltipButton icon="fa-trash" tooltip="Delete" color="error"></ToolbarTooltipButton>
            </v-card-actions>
          </v-card>
        </template>
        <template v-else>
        </template>
        <DeviceSettings :id="id"></DeviceSettings>
      </v-col>
      <v-col cols="12" md="8">

        <PtyComponent v-if="showConsole" :reconnect="true" :clearButton="true" @clear="clearConsole" :copyButton="true"
          title="Console" :hello="(device.nativeId || 'undefined')" nativeId="consoleservice" :control="false"
          :options="{ pluginId: device.pluginId }" close @close="showConsole = false" class="mb-4"></PtyComponent>
        <PtyComponent v-if="showRepl" :copyButton="true" title="REPL" :hello="(device.nativeId || 'undefined')"
          nativeId="replservice" :control="false" :options="{ pluginId: device.pluginId }" close
          @close="showRepl = false" class="mb-4"></PtyComponent>
        <Camera v-if="hasRTC" :id="id" class="mb-4"></Camera>

        <DeviceProvider class="mb-4" v-if="hasOrCanCreateDevices" :id="id"></DeviceProvider>
        <MixinProvider v-if="canExtendDevices" :id="id"></MixinProvider>
      </v-col>
    </v-row>
  </v-container>

</template>
<script setup lang="ts">
import { connectedClient } from '@/common/client';
import { getAllDevices } from '@/common/devices';
import { hasFixedPhysicalLocation, typeToIcon } from '@/device-icons';
import { getDeviceFromRoute } from '@/id-device';
import { ScryptedInterface } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import DeviceSettings from './DeviceSettings.vue';
import InlineTextField from './InlineTextField.vue';
import PtyComponent from './PtyComponent.vue';
import ToolbarTooltipButton from './ToolbarTooltipButton.vue';
import Camera from './interfaces/Camera.vue';
import DeviceProvider from './interfaces/DeviceProvider.vue';
import MixinProvider from './interfaces/MixinProvider.vue';

const { mdAndUp } = useDisplay();
const showConsole = ref<boolean | undefined>(false);
const showRepl = ref(false);

const { id, device } = getDeviceFromRoute();

const hasOrCanCreateDevices = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.DeviceCreator) || getAllDevices().find(d => d.providerId === id.value);
});

const canExtendDevices = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.MixinProvider);
});

const hasRTC = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.RTCSignalingChannel);
});

watch(() => device.value, () => resetPtys());

function resetPtys() {
  showConsole.value = hasFixedPhysicalLocation(device.value?.type!);
  showRepl.value = false;
}
resetPtys();

async function clearConsole() {
  const plugins = await connectedClient.value!.systemManager.getComponent(
    "plugins"
  );
  plugins.clearConsole(id.value);
}
</script>
