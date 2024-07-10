<template>
  <v-container fluid>
    <!-- <v-row v-if="hasScriptable">
      <v-col cols="12">
      <Scriptable v-if="hasScriptable" :id="id" class="mb-4" @run="showConsole = true"></Scriptable>
    </v-col>
    </v-row> -->
    <v-row v-if="device">
      <v-col cols="12" md="4">
        <template v-if="device">
          <v-card class="mb-4">
            <template v-slot:prepend>
              <v-icon size="xx-small" :icon="typeToIcon(device.type)"></v-icon>
            </template>

            <template v-slot:title>
              <template v-if="!isScryptedPlugin">
                <div style="display: flex; align-items: center;">
                  <InlineTextField :model-value="device.name" size="small" @update:editing="v => editingName = v">
                  </InlineTextField>
                  <v-card-subtitle class="mt-1" v-if="!editingName">ID: {{ device.id }}</v-card-subtitle>
                </div>
              </template>
              <template v-else>
                <div style="display: flex;">
                  <v-btn size="small" density="compact" variant="text">{{ device.name }}</v-btn>
                </div>
              </template>
            </template>

            <template v-slot:append v-if="isScryptedPlugin">
              <div style="display: flex;">
                <ScryptedPlugin :id="id" @update:plugin="showConsole = true"></ScryptedPlugin>
              </div>
            </template>
            <template v-slot:append
              v-if="!isScryptedPlugin && device.providerId && device.nativeId && mdAndUp && !editingName">
              <div style="display: flex; align-items: center;">
                <v-btn :to="`/device/${device.providerId}`" variant="text" size="small" density="compact">{{
                  connectedClient?.systemManager.getDeviceById(device.providerId).name }}</v-btn>
              </div>
            </template>

            <v-card-actions>
              <template v-if="isScryptedPlugin">
                <v-btn size="small" color="info"
                  @click="showConsole = true; restartPlugin(device.info.manufacturer)">Restart Plugin</v-btn>
                <ToolbarTooltipButton icon="fa-rectangle-history" tooltip="Log" @click="showConsole = !showConsole">
                </ToolbarTooltipButton>
              </template>
              <v-btn v-else class="ml-1" size="small" color="info" @click="showConsole = !showConsole">Log</v-btn>
              <ToolbarTooltipButton icon="fa-clock-rotate-left" tooltip="Events"></ToolbarTooltipButton>
              <ToolbarTooltipButton icon="fa-rectangle-terminal" tooltip="REPL" @click="showRepl = !showRepl">
              </ToolbarTooltipButton>
              <ToolbarTooltipButton v-if="device.info?.managementUrl" icon="fa-wrench" tooltip="Manufacturer Settings"
                :href="device.info.managementUrl" target="_blank"></ToolbarTooltipButton>
              <v-spacer></v-spacer>
              <DeleteDeviceDialog :id="id">
                <template v-slot:activator="{ activatorProps }">
                  <ToolbarTooltipButton v-bind="activatorProps" icon="fa-trash" tooltip="Delete" color="error">
                  </ToolbarTooltipButton>
                </template>

              </DeleteDeviceDialog>
            </v-card-actions>
          </v-card>
        </template>
        <template v-else>
        </template>
        <DeviceSettings :id="id" class="mb-4"></DeviceSettings>
        <Readme v-if="hasReadme" :id="id"></Readme>
      </v-col>
      <v-col cols="12" md="8">
        <Scriptable v-if="hasScriptable" :id="id" class="mb-4" @run="showConsole = true"></Scriptable>
        <Camera v-if="hasRTC" :id="id" class="mb-4"></Camera>

        <DeviceProvider v-if="hasOrCanCreateDevices" class="mb-4" :id="id"></DeviceProvider>
        <MixinProvider v-if="canExtendDevices" class="mb-4" :id="id"></MixinProvider>
        <PtyComponent v-if="showConsole" :reconnect="true" :clearButton="true" @clear="clearConsole(id)"
          :copyButton="true" title="Log" :hello="(device.nativeId || 'undefined')" nativeId="consoleservice"
          :control="false" :options="{ pluginId: device.pluginId }" close @close="showConsole = false" class="mb-4">
        </PtyComponent>
        <PtyComponent v-if="showRepl" :copyButton="true" title="REPL" :hello="(device.nativeId || 'undefined')"
          nativeId="replservice" :control="false" :options="{ pluginId: device.pluginId }" close
          @close="showRepl = false" class="mb-4"></PtyComponent>
      </v-col>
    </v-row>
  </v-container>

</template>
<script setup lang="ts">
import { connectedClient } from '@/common/client';
import { getAllDevices } from '@/common/devices';
import { hasFixedPhysicalLocation, typeToIcon } from '@/device-icons';
import { getDeviceFromId, getIdFromRoute } from '@/id-device';
import { ScryptedInterface } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import DeleteDeviceDialog from './DeleteDeviceDialog.vue';
import DeviceSettings from './DeviceSettings.vue';
import InlineTextField from './InlineTextField.vue';
import PtyComponent from './PtyComponent.vue';
import ToolbarTooltipButton from './ToolbarTooltipButton.vue';
import Camera from './interfaces/Camera.vue';
import DeviceProvider from './interfaces/DeviceProvider.vue';
import MixinProvider from './interfaces/MixinProvider.vue';
import Readme from './interfaces/Readme.vue';
import Scriptable from './interfaces/Scriptable.vue';
import ScryptedPlugin from './interfaces/ScryptedPlugin.vue';
import { clearConsole, restartPlugin } from './plugin/plugin-apis';

const { mdAndUp } = useDisplay();
const showConsole = ref<boolean | undefined>(false);
const showRepl = ref(false);
const editingName = ref(false);

const routeId = getIdFromRoute();

const props = defineProps<{
  id?: string;
}>();

const id = computed(() => props.id || routeId.value);
const device = getDeviceFromId(() => id.value);

const hasOrCanCreateDevices = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.DeviceCreator) || getAllDevices().find(d => d.providerId === id.value);
});

const canExtendDevices = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.MixinProvider);
});

const hasRTC = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.RTCSignalingChannel);
});

const hasScriptable = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.Scriptable);
});

const isScryptedPlugin = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.ScryptedPlugin);
});

const hasReadme = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.Readme);
});

watch(() => device.value, () => resetPtys());

function resetPtys() {
  showConsole.value = hasFixedPhysicalLocation(device.value?.type!);
  showRepl.value = false;
}
resetPtys();
</script>
