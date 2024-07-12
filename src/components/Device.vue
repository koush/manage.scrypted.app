<template>
  <v-container fluid style="position: relative;">
    <div v-if="clipPath" class="blur" style="position: absolute; width: 100%; height: 100%;"></div>
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
        <DeviceSettings :id="id" class="mb-4" @click-button-setting="clickButtonSetting"></DeviceSettings>
        <Readme v-if="hasReadme" :id="id"></Readme>
      </v-col>
      <v-col cols="12" md="8">
        <Scriptable v-if="hasScriptable" :id="id" class="mb-4" @run="showConsole = true"></Scriptable>
        <Camera v-if="hasCamera" :id="id" clickable class="mb-4 never-blur" :hide-refresh="!!playing"
          @img:click="playing = destination">
          <ClipPathEditor v-if="clipPath" v-model="clipPath" class="over-camera" style="z-index: 3; cursor: pointer;">
          </ClipPathEditor>
          <RTCSignalingChannel v-if="hasRTC && playing" :id="id" class="over-camera" :destination="playing">
          </RTCSignalingChannel>
          <ObjectDetector v-if="playing && hasObjectDetector" :id="id" class="over-camera"></ObjectDetector>

          <template v-slot:prepend>
            <template v-if="clipPath">
              <v-card-subtitle class="mt-1">Edit Zone</v-card-subtitle>
              <ToolbarTooltipButton :icon="getFaPrefix('fa-cancel')" variant="text" size="small" @click="cancelClipPath"
                tooltip="Cancel"></ToolbarTooltipButton>
              <ToolbarTooltipButton color="error" :icon="getFaPrefix('fa-broom-wide')" variant="text" size="small"
                @click="resetClipPath" tooltip="Clear Points"></ToolbarTooltipButton>
              <ToolbarTooltipButton color="success" :icon="getFaPrefix('fa-check')" variant="text" size="small"
                @click="saveClipPath" tooltip="Save Points"></ToolbarTooltipButton>
            </template>
            <template v-else-if="hasRTC">
              <template v-if="!playing">
                <ToolbarTooltipButton color="success" :icon="getFaPrefix('fa-play')" variant="text" size="small"
                  @click="playing = destination" tooltip="Play">
                </ToolbarTooltipButton>
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn variant="text" size="small" v-bind="props">
                      Stream: {{ destination }}
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item v-for="(item, index) in destinations" :key="index" :value="index"
                      @click="destination = item">
                      <v-list-item-title>{{ item }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
              <ToolbarTooltipButton v-else color="error" :icon="getFaPrefix('fa-stop')" variant="text" size="small"
                @click="playing = undefined" :tooltip="`Stop (Stream: ${destination})`">
              </ToolbarTooltipButton>
            </template>

          </template>
        </Camera>

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
import { ClipPathModel } from '@/clip-path-model';
import { connectedClient } from '@/common/client';
import { getAllDevices } from '@/common/devices';
import { getFaPrefix, hasFixedPhysicalLocation, typeToIcon } from '@/device-icons';
import { getDeviceFromId, getIdFromRoute } from '@/id-device';
import { ClipPath, ScryptedInterface, Setting, Settings } from '@scrypted/types';
import { computed, nextTick, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import ClipPathEditor from './ClipPathEditor.vue';
import DeleteDeviceDialog from './DeleteDeviceDialog.vue';
import DeviceSettings from './DeviceSettings.vue';
import InlineTextField from './InlineTextField.vue';
import PtyComponent from './PtyComponent.vue';
import ToolbarTooltipButton from './ToolbarTooltipButton.vue';
import Camera from './interfaces/Camera.vue';
import DeviceProvider from './interfaces/DeviceProvider.vue';
import MixinProvider from './interfaces/MixinProvider.vue';
import ObjectDetector from './interfaces/ObjectDetector.vue';
import RTCSignalingChannel from './interfaces/RTCSignalingChannel.vue';
import Readme from './interfaces/Readme.vue';
import Scriptable from './interfaces/Scriptable.vue';
import ScryptedPlugin from './interfaces/ScryptedPlugin.vue';
import { PlaybackType } from './interfaces/camera-common';
import { TrackedSetting } from './interfaces/settings/setting-modelvalue';
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
const device = getDeviceFromId<Settings>(() => id.value);

const hasOrCanCreateDevices = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.DeviceCreator) || getAllDevices().find(d => d.providerId === id.value);
});

const canExtendDevices = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.MixinProvider);
});

const hasCamera = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.Camera);
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

const hasRTC = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.RTCSignalingChannel);
});

const hasObjectDetector = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.ObjectDetector);
});

watch(() => id.value, () => {
  playing.value = undefined;
  resetPtys();
});

function resetPtys() {
  showConsole.value = hasFixedPhysicalLocation(device.value?.type!);
  showRepl.value = false;
}
resetPtys();

const clipPath = ref<ClipPathModel>();
let clipPathSetting: TrackedSetting;
async function clickButtonSetting(setting: Setting) {
  if (setting.type === 'clippath') {
    if (typeof setting.value === 'string') {
      try {
        setting.value = JSON.parse(setting.value);
        setting.value = (setting.value as ClipPath).map((p: number[]) => [p[0] / 100, p[1] / 100]) as ClipPath;
      }
      catch (e) {
        setting.value = undefined;
      }
    }
    clipPathSetting = setting;
    if (setting && !Array.isArray(setting.value))
      setting.value = undefined;
    clipPath.value = { points: (setting.value as any) || [] };
    return;
  }

  if (setting.type === 'button') {
    await device.value.putSetting(setting.key, undefined);
  }
}
async function cancelClipPath() {
  clipPath.value = undefined;
  await nextTick();
  clipPathSetting.value = clipPathSetting.originalValue;
}
async function saveClipPath() {
  clipPath.value = undefined;
  await device.value.putSetting(clipPathSetting.key, clipPathSetting.value);
}
function resetClipPath() {
  clipPath.value?.points.splice(0, clipPath.value?.points.length);
}
watch(() => clipPath.value?.points, () => {
  if (typeof clipPathSetting.originalValue === 'string')
    clipPathSetting.value = JSON.stringify(clipPath.value?.points?.map(p => [p[0] * 100, p[1] * 100]));
  else
    clipPathSetting.value = clipPath.value?.points;
}, {
  deep: true,
});

const playing = ref<PlaybackType>();
const destination = ref<PlaybackType>('Default');
const destinations: PlaybackType[] = [
  'Default',
  'local',
  'local-recorder',
  'remote',
  'low-resolution',
  'remote-recorder',
];

</script>
<style scoped>
.blur {
  z-index: 1;
  backdrop-filter: blur(10px);
}

.never-blur {
  z-index: 2;
}

.over-camera {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>
