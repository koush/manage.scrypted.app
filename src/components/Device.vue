<template>
  <v-container fluid style="position: relative;">
    <div v-if="clipPath" class="blur" style="position: absolute; width: 100%; height: 100%;"></div>
    <v-row v-if="device" justify="center">
      <ResponsiveColumn cols="12" :md="6" :xl="hasMiddleSlots && hasExtraSlots ? 3 : 4">
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
                  connectedClient?.systemManager.getDeviceById(device.providerId)?.name }}</v-btn>
              </div>
            </template>

            <v-card-actions>
              <OauthClient v-if="hasOauthClient" :id="id"></OauthClient>
              <template v-if="isAdmin">
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
              </template>
              <v-badge v-if="hasReadme && !showReadme" dot color="error" offset-x="8">
                <ToolbarTooltipButton size="x-small" icon="fa-book" tooltip="Readme" @click="setReadme(true)">
                </ToolbarTooltipButton>
              </v-badge>

              <ToolbarTooltipButton v-if="device.info?.managementUrl" size="x-small" icon="fa-wrench"
                tooltip="Manufacturer Settings" :href="device.info.managementUrl" target="_blank">
              </ToolbarTooltipButton>
              <v-spacer></v-spacer>
              <DeleteDeviceDialog v-if="isAdmin" :id="id">
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

        <Notifier v-if="hasNotifier" :id="id" class="mb-4"></Notifier>
        <DeviceSettings :id="id" class="mb-4" @click-button-setting="clickButtonSetting"
          @show-console="showConsole = true">
        </DeviceSettings>

        <MixinProvider v-if="hasMixinProvider" class="mb-4" :id="id"></MixinProvider>

        <VideoClipsInterface v-if="showVideoClips" :id="id" class="mb-4" @click:clip="playVideoClip">
        </VideoClipsInterface>
        <StateToggles :id="id" class="mb-4"></StateToggles>
      </ResponsiveColumn>
      <DeviceLayout v-if="hasMiddleSlots || hasExtraSlots" ref="deviceLayout" :hide-default="!hasMiddleSlots"
        :hide-extra="!hasExtraSlots">
        <template v-slot:default>
          <template v-if="!isTouchDevice">
            <v-alert v-for="alert in deviceAlerts" :key="alert._id" class="mb-2" color="error" closable
              density="compact" :text="alert.message" @click:close="removeAlert(alert)"></v-alert>
          </template>

          <Suspense v-if="hasScriptable">
            <Scriptable :id="id" class="mb-4" @run="showConsole = true"></Scriptable>
          </Suspense>
          <DeviceProvider v-if="hasDeviceCreator || hasDeviceDiscovery || providerHasVisibleDevices" class="mb-4" :id="id"></DeviceProvider>
          <ObjectDetection v-if="hasObjectDetection" :id="id" class="mb-4"></ObjectDetection>
          <Suspense>
            <PositionSensor v-if="hasPositionSensor" :id="id" class="mb-4"></PositionSensor>
          </Suspense>
          <Camera v-if="clipPathDeviceId || hasCamera" :id="cameraIdOrClipPathId" clickable class="mb-4 never-blur"
            :hide-refresh="!!playing || !!videoClip" @img:click="playing = destination" ref="camera"
            :img-style="clipPath ? 'transform: scale(.9);' : undefined">
            <ClipPathEditor v-if="clipPath" v-model="clipPath" class="over-camera" style="z-index: 3; cursor: pointer;"
              :scale=".9">
            </ClipPathEditor>
            <RTCSignalingChannel v-if="hasRTC && playing" :id="cameraIdOrClipPathId" class="over-camera"
              :destination="playing" :muted="muted" :microphone="!!talkback">
            </RTCSignalingChannel>
            <KvmComponent v-if="hasKVMService && playing" :id="id" class="over-camera" style="z-index: 3; cursor: pointer;"></KvmComponent>
            <video v-if="videoClip" class="over-camera" :src="videoClip" playsinline autoplay controls muted
              style="width: 100%; height: 100; object-fit: contain;"
              :style="clipPath ? 'transform: scale(.9);' : undefined"></video>
            <ObjectDetector v-if="playing && hasObjectDetector" :id="cameraIdOrClipPathId" class="over-camera"
              :style="clipPath ? 'transform: scale(.9);' : undefined"></ObjectDetector>

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
          <PtyComponent v-if="hasTTYService" :reconnect="true" title="TTY Interface" :expand-button="true"
            :control="true" :pluginId="device.pluginId" :nativeId="device.nativeId" class="mb-4">
          </PtyComponent>

        </template>
        <template v-slot:extra>
          <Readme v-if="hasReadme && showReadme" :id="id" class="mb-4" @close="setReadme(false)"></Readme>

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
import { connectedClient, fixupAppDomainImageUrl, isAdmin } from '@/common/client';
import { ClipPathModel } from '@/common/clip-path-model';
import { getAllDevices } from '@/common/devices';
import { isTouchDevice } from '@/common/size';
import { getFaPrefix, typeToIcon } from '@/device-icons';
import { getDeviceFromId, getIdFromRoute } from '@/id-device';
import { sleep } from "@scrypted/common/src/sleep";
import { ClipPath, ScryptedDeviceType, ScryptedInterface, ScryptedMimeTypes, Setting, Settings, VideoClip, VideoClips } from '@scrypted/types';
import { ComponentPublicInstance, computed, nextTick, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import ClipPathEditor from '../common/components/ClipPathEditor.vue';
import { clearConsole, removeAlert, restartPlugin, scryptedAlerts } from '../internal-apis';
import DeleteDeviceDialog from './DeleteDeviceDialog.vue';
import DeviceLayout from './DeviceLayout.vue';
import DeviceSettings from './DeviceSettings.vue';
import PtyComponent from './PtyComponent.vue';
import KvmComponent from './KvmComponent.vue';
import ResponsiveColumn from './ResponsiveColumn.vue';
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

const hasDeviceDiscovery = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.DeviceDiscovery);
});

const providerHasVisibleDevices = computed(() => {
  return getAllDevices().find(d => d.providerId === id.value && d.id !== id.value && d.type !== ScryptedDeviceType.Internal);
});

const hasMixinProvider = computed(() => {
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

const hasKVMService = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.StreamService) && device.value?.interfaces.includes(ScryptedInterface.RTCSignalingChannel);
})

const isScryptedPlugin = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.ScryptedPlugin);
});

const hasOauthClient = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.OauthClient);
});

const showReadme = ref(localStorage.getItem('showReadme') === 'true');
function setReadme(value: boolean) {
  showReadme.value = value;
  localStorage.setItem('showReadme', value.toString());
}

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
  // make it easy to debug specific devices.
  if (isAdmin.value && !isTouchDevice) {
    switch (device.value?.type) {
      case ScryptedDeviceType.Camera:
      case ScryptedDeviceType.Doorbell:
      case ScryptedDeviceType.DeviceProvider:
      case ScryptedDeviceType.API:
        showConsole.value = true;
        break;
      default:
        showConsole.value = false;
        break;
    }
  }
  else {
    showConsole.value = false;
  }
  showRepl.value = false;
}
resetPtys();

function fixLegacyClipPath(clipPath: ClipPath): ClipPath {
  if (!clipPath)
    return;

  // if any value is over abs 2, then divide by 100.
  // this is a workaround for the old scrypted bug where the path was not normalized.
  // this is a temporary workaround until the path is normalized in the UI.
  let needNormalize = false;
  for (const p of clipPath) {
    for (const c of p) {
      if (Math.abs(c) >= 2)
        needNormalize = true;
    }
  }

  if (!needNormalize)
    return clipPath;

  return clipPath.map(p => p.map(c => c / 100)) as ClipPath;
}

const clipPath = ref<ClipPathModel>();
const clipPathDeviceId = ref<string>();
const cameraIdOrClipPathId = computed(() => clipPathDeviceId.value || id.value);
let clipPathSetting: TrackedSetting;
async function clickButtonSetting(setting: Setting) {
  if (setting.console)
    showConsole.value = true;
  if (setting.type === 'clippath') {
    if (typeof setting.value === 'string') {
      try {
        setting.value = fixLegacyClipPath(JSON.parse(setting.value));
      }
      catch (e) {
        setting.value = undefined;
      }
    }
    clipPathSetting = setting;
    if (setting && !Array.isArray(setting.value))
      setting.value = undefined;
    clipPath.value = { points: (setting.value as any) || [] };
    clipPathDeviceId.value = setting.deviceFilter;
    scrollToComponent(() => cameraCard.value);
    return;
  }

  if (setting.type === 'button') {
    await device.value.putSetting(setting.key, undefined);
  }
}
async function cancelClipPath() {
  clipPath.value = undefined;
  clipPathDeviceId.value = undefined;
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
  await sleep(500);
  const el: HTMLElement = component()?.$el;
  el?.scrollIntoView({
    block: 'start',
    inline: 'nearest',
    behavior: 'smooth',
  });
}

const hasMiddleSlots = computed(() => {
  return hasScriptable.value
    || hasObjectDetection.value
    || hasPositionSensor.value
    || hasCamera.value
    || clipPathDeviceId.value
    || hasTTYService.value
    || (hasDeviceCreator.value || providerHasVisibleDevices.value)
    // || hasDeviceCreator.value
    // || hasMixinProvider.value
    // || hasDevices.value
    ;
});
const hasExtraSlots = computed(() => {
  return showConsole.value
    || showEvents.value
    || showRepl.value
    || (hasReadme.value && showReadme.value)
    ;
});

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
