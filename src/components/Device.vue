<template>
  <v-container fluid style="position: relative;">
    <div v-if="clipPath" class="blur" style="position: absolute; width: 100%; height: 100%;"></div>
    <v-row v-if="device">
      <v-col cols="12" md="4" xl="3">
        <template v-if="isTouchDevice">
          <v-alert v-for="alert in deviceAlerts" :key="alert._id" class="mb-2" color="error" closable density="compact"
            :text="alert.message" @click:close="removeAlert(alert)"></v-alert>
        </template>
        <template v-if="device">
          <v-card class="mb-4">
            <template v-slot:prepend>
              <v-icon size="xx-small" class="mt-1" :icon="typeToIcon(device.type)"></v-icon>
            </template>

            <template v-slot:title>
              <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
                {{ device.name }}
              </v-card-subtitle>
            </template>

            <template v-slot:append v-if="isScryptedPlugin">
              <div style="display: flex;">
                <ScryptedPlugin :id="id" @update:plugin="showConsole = true"></ScryptedPlugin>
              </div>
            </template>
            <template v-slot:append v-if="!isScryptedPlugin && device.providerId && device.nativeId && mdAndUp">
              <div style="display: flex; align-items: center;">
                <v-btn :to="`/device/${device.providerId}`" variant="text" size="x-small" density="compact">{{
                  connectedClient?.systemManager.getDeviceById(device.providerId).name }}</v-btn>
              </div>
            </template>

            <v-card-actions>
              <OauthClient v-if="hasOauthClient" :id="id"></OauthClient>
              <template v-if="isScryptedPlugin">
                <v-btn size="x-small" color="info"
                  @click="showConsole = true; restartPlugin(device.info.manufacturer)">Restart Plugin</v-btn>
                <ToolbarTooltipButton size="x-small" icon="fa-rectangle-history" tooltip="Log"
                  @click="showConsole = true; scrollToComponent(() => consoleCard)">
                </ToolbarTooltipButton>
              </template>
              <v-btn v-else class="ml-1" size="x-small" color="info"
                @click="showConsole = true; scrollToComponent(() => consoleCard)">Log</v-btn>
              <ToolbarTooltipButton size="x-small" icon="fa-clock-rotate-left" tooltip="Events"
                @click="showEvents = true; scrollToComponent(() => eventsCard);">
              </ToolbarTooltipButton>
              <ToolbarTooltipButton size="x-small" icon="fa-rectangle-terminal" tooltip="REPL"
                @click="showRepl = true; scrollToComponent(() => replCard);">
              </ToolbarTooltipButton>
              <ToolbarTooltipButton v-if="device.info?.managementUrl" size="x-small" icon="fa-wrench"
                tooltip="Manufacturer Settings" :href="device.info.managementUrl" target="_blank">
              </ToolbarTooltipButton>
              <v-spacer></v-spacer>
              <DeleteDeviceDialog :id="id">
                <template v-slot:activator="{ activatorProps }">
                  <ToolbarTooltipButton v-bind="activatorProps" size="x-small" icon="fa-trash" tooltip="Delete"
                    color="error">
                  </ToolbarTooltipButton>
                </template>

              </DeleteDeviceDialog>
            </v-card-actions>
          </v-card>
        </template>
        <template v-else>
        </template>
        <VideoClipsInterface v-if="showVideoClips" :id="id" class="mb-4" @click:clip="playVideoClip">
        </VideoClipsInterface>
        <Notifier v-if="hasNotifier" :id="id" class="mb-4"></Notifier>
        <DeviceSettings :id="id" class="mb-4" @click-button-setting="clickButtonSetting"></DeviceSettings>
        <Readme v-if="hasReadme" :id="id" class="mb-4"></Readme>
        <StateToggles :id="id" class="mb-4"></StateToggles>
      </v-col>
      <DeviceLayout>
        <template v-slot:default>
          <template v-if="!isTouchDevice">
            <v-alert v-for="alert in deviceAlerts" :key="alert._id" class="mb-2" color="error" closable
              density="compact" :text="alert.message" @click:close="removeAlert(alert)"></v-alert>
          </template>

          <Suspense>
            <Scriptable v-if="hasScriptable" :id="id" class="mb-4" @run="showConsole = true"></Scriptable>
          </Suspense>
          <ObjectDetection v-if="hasObjectDetection" :id="id" class="mb-4"></ObjectDetection>
          <Suspense>
            <PositionSensor v-if="hasPositionSensor" :id="id" class="mb-4"></PositionSensor>
          </Suspense>
          <Camera v-if="hasCamera" :id="id" clickable class="mb-4 never-blur" :hide-refresh="!!playing"
            @img:click="playing = destination" ref="camera">
            <ClipPathEditor v-if="clipPath" v-model="clipPath" class="over-camera" style="z-index: 3; cursor: pointer;">
            </ClipPathEditor>
            <RTCSignalingChannel v-if="hasRTC && playing" :id="id" class="over-camera" :destination="playing"
              :muted="muted" :microphone="!!talkback">
            </RTCSignalingChannel>
            <video v-if="videoClip" class="over-camera" :src="videoClip" playsinline autoplay controls muted
              style="width: 100%; height: 100; object-fit: contain;"></video>
            <ObjectDetector v-if="playing && hasObjectDetector" :id="id" class="over-camera"></ObjectDetector>

            <template v-slot:prepend>
              <template v-if="clipPath">
                <v-card-subtitle class="mt-1">Edit Zone</v-card-subtitle>
                <ToolbarTooltipButton :icon="getFaPrefix('fa-cancel')" variant="text" size="small"
                  @click="cancelClipPath" tooltip="Cancel"></ToolbarTooltipButton>
                <ToolbarTooltipButton color="error" :icon="getFaPrefix('fa-broom-wide')" variant="text" size="small"
                  @click="resetClipPath" tooltip="Clear Points"></ToolbarTooltipButton>
                <ToolbarTooltipButton color="success" :icon="getFaPrefix('fa-check')" variant="text" size="small"
                  @click="saveClipPath" tooltip="Save Points"></ToolbarTooltipButton>
              </template>
              <template v-if="videoClip">
                <ToolbarTooltipButton color="error" :icon="getFaPrefix('fa-stop')" variant="text" size="small"
                  @click="videoClip = undefined" :tooltip="`Stop Playback`">
                </ToolbarTooltipButton>
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
                <template v-else>
                  <ToolbarTooltipButton color="error" :icon="getFaPrefix('fa-stop')" variant="text" size="small"
                    @click="playing = undefined" :tooltip="`Stop (Stream: ${destination})`">
                  </ToolbarTooltipButton>
                  <ToolbarTooltipButton color="error" :icon="getFaPrefix(!muted ? 'fa-volume' : 'fa-volume-slash')"
                    variant="text" size="small" @click="muted = !muted" tooltip="Toggle Audio">
                  </ToolbarTooltipButton>
                  <ToolbarTooltipButton v-if="hasIntercom" color="error"
                    :icon="getFaPrefix(!talkback ? 'fa-microphone' : 'fa-microphone-slash')" variant="text" size="small"
                    @click="talkback = !talkback" tooltip="Talk Back">
                  </ToolbarTooltipButton>
                </template>
              </template>

            </template>
          </Camera>

          <DeviceProvider v-if="hasDeviceCreator" class="mb-4" :id="id"></DeviceProvider>
          <MixinProvider v-if="canExtendDevices" class="mb-4" :id="id"></MixinProvider>
          <DeviceProvider v-if="!hasDeviceCreator && hasDevices" class="mb-4" :id="id"></DeviceProvider>

        </template>
        <template v-slot:extra>

          <PtyComponent v-if="hasTTYService" :reconnect="true" title="TTY Interface" :expand-button="true"
            :control="true" :pluginId="device.pluginId" :nativeId="(device.nativeId || 'undefined')" class="mb-4">
          </PtyComponent>
          <PtyComponent v-if="showConsole" ref="consoleCard" :reconnect="true" :clearButton="true"
            @clear="clearConsole(id)" :expand-button="true" :copyButton="true" title="Log"
            :hello="(device.nativeId || 'undefined')" nativeId="consoleservice" :control="false"
            :options="{ pluginId: device.pluginId }" close @close="showConsole = false" class="mb-4">
          </PtyComponent>
          <PtyComponent v-if="showRepl" ref="replCard" :copyButton="true" title="REPL"
            :hello="(device.nativeId || 'undefined')" :expand-button="true" nativeId="replservice" :control="false"
            :options="{ pluginId: device.pluginId }" close @close="showRepl = false" class="mb-4"></PtyComponent>
          <ScryptedLogger v-if="showEvents" ref="eventsCard" :id="id" @close="showEvents = false"></ScryptedLogger>
        </template>
      </DeviceLayout>

    </v-row>
  </v-container>

</template>
<script setup lang="ts">
import { ClipPathModel } from '@/clip-path-model';
import { connectedClient, fixupAppDomainImageUrl } from '@/common/client';
import { getAllDevices } from '@/common/devices';
import { isTouchDevice } from '@/common/size';
import { getFaPrefix, hasFixedPhysicalLocation, typeToIcon } from '@/device-icons';
import { getDeviceFromId, getIdFromRoute } from '@/id-device';
import { ClipPath, ScryptedDeviceType, ScryptedInterface, ScryptedMimeTypes, Setting, Settings, VideoClip, VideoClips } from '@scrypted/types';
import { ComponentPublicInstance, computed, nextTick, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { clearConsole, removeAlert, restartPlugin, scryptedAlerts } from '../internal-apis';
import ClipPathEditor from './ClipPathEditor.vue';
import DeleteDeviceDialog from './DeleteDeviceDialog.vue';
import DeviceLayout from './DeviceLayout.vue';
import DeviceSettings from './DeviceSettings.vue';
import PtyComponent from './PtyComponent.vue';
import ToolbarTooltipButton from './ToolbarTooltipButton.vue';
import Camera from './interfaces/Camera.vue';
import DeviceProvider from './interfaces/DeviceProvider.vue';
import MixinProvider from './interfaces/MixinProvider.vue';
import Notifier from './interfaces/Notifier.vue';
import OauthClient from './interfaces/OauthClient.vue';
import PositionSensor from './interfaces/PositionSensor.vue';
import RTCSignalingChannel from './interfaces/RTCSignalingChannel.vue';
import Readme from './interfaces/Readme.vue';
import Scriptable from './interfaces/Scriptable.vue';
import ScryptedLogger from './interfaces/ScryptedLogger.vue';
import ScryptedPlugin from './interfaces/ScryptedPlugin.vue';
import VideoClipsInterface from './interfaces/VideoClips.vue';
import { PlaybackType } from './interfaces/camera-common';
import ObjectDetection from './interfaces/detection/ObjectDetection.vue';
import ObjectDetector from './interfaces/detection/ObjectDetector.vue';
import { TrackedSetting } from './interfaces/settings/setting-modelvalue';
import StateToggles from './interfaces/statetoggle/StateToggles.vue';

const { mdAndUp } = useDisplay();
const showConsole = ref<boolean | undefined>(false);
const showRepl = ref(false);
const showEvents = ref(false);
const muted = ref(true);

const routeId = getIdFromRoute();

const props = defineProps<{
  id?: string;
}>();

const id = computed(() => props.id || routeId.value);
const device = getDeviceFromId<Settings & VideoClips>(() => id.value);

const hasDeviceCreator = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.DeviceCreator);
});

const hasDevices = computed(() => {
  return getAllDevices().find(d => d.providerId === id.value && d.id !== id.value);
});

const canExtendDevices = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.MixinProvider);
});

const hasCamera = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.Camera);
});

const hasObjectDetection = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.ObjectDetection);
});

const hasScriptable = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.Scriptable);
});

const hasPositionSensor = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.PositionSensor);
});

const hasTTYService = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.StreamService) && device.value?.interfaces.includes(ScryptedInterface.TTY);
});

const isScryptedPlugin = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.ScryptedPlugin);
});

const hasOauthClient = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.OauthClient);
});

const hasReadme = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.Readme);
});

const hasRTC = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.RTCSignalingChannel);
});

const hasVideoClips = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.VideoClips);
});

const hasNotifier = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.Notifier);
});

const showVideoClips = computed(() => {
  if (!hasCamera.value)
    return false;
  if (hasVideoClips.value)
    return true;
  // it could potentially save video clips, so offer it.
  return device.value?.type === ScryptedDeviceType.Camera || device.value?.type === ScryptedDeviceType.Doorbell;
});

const hasIntercom = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.Intercom);
});

const hasObjectDetector = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.ObjectDetector);
});

watch(() => device.value, () => {
  playing.value = undefined;
  talkback.value = false;
  resetPtys();
});

function resetPtys() {
  showConsole.value = hasFixedPhysicalLocation(device.value?.type!) && !isTouchDevice.value;
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
    scrollToComponent(() => cameraCard.value);
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
  if (!clipPathSetting.originalValue || typeof clipPathSetting.originalValue === 'string')
    clipPathSetting.value = JSON.stringify(clipPath.value?.points?.map(p => [p[0] * 100, p[1] * 100]));
  else
    clipPathSetting.value = clipPath.value?.points;
}, {
  deep: true,
});

const playing = ref<PlaybackType>();
const talkback = ref(false);
const destination = ref<PlaybackType>('Default');
const destinations: PlaybackType[] = [
  'Default',
  'local',
  'local-recorder',
  'remote',
  'low-resolution',
  'remote-recorder',
];

const deviceAlerts = computed(() => {
  const devicePath = `/device/${id.value}`;
  return scryptedAlerts.value.filter(a => a.path === devicePath);
});

const videoClip = ref<string>();
async function playVideoClip(vc: VideoClip) {
  console.warn(vc);
  let href = vc.resources?.video?.href;
  if (!href) {
    const mo = await device.value.getVideoClip(vc.videoId);

    href = (await connectedClient.value.mediaManager.convertMediaObject(mo, ScryptedMimeTypes.LocalUrl)).toString();
  }
  videoClip.value = fixupAppDomainImageUrl(href);
  scrollToComponent(() => cameraCard.value);
}

const cameraCard = ref<ComponentPublicInstance>();
const consoleCard = ref<ComponentPublicInstance>();
const eventsCard = ref<ComponentPublicInstance>();
const replCard = ref<ComponentPublicInstance>();

async function scrollToComponent(component: () => ComponentPublicInstance) {
  await nextTick();
  component()?.$el.scrollIntoView();
}
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
