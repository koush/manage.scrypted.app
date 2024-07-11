<template>
  <v-card>
    <template v-if="hasRTC" v-slot:prepend>
      <template v-if="!playing">
        <v-btn :prepend-icon="getFaPrefix('fa-play')" variant="text" size="small" @click="play">Play</v-btn>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn variant="text" size="small" v-bind="props">
              Stream: {{ destination }}
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-for="(item, index) in destinations" :key="index" :value="index" @click="destination = item">
              <v-list-item-title>{{ item }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
      <v-btn v-else :prepend-icon="getFaPrefix('fa-stop')" variant="text" size="small" @click="stop">Stop (Stream: {{ destination }})</v-btn>
    </template>
    <template v-slot:append v-if="!playing">
      <v-btn :prepend-icon="getFaPrefix('fa-refresh')" variant="text" size="small" @click="counter++">Refresh</v-btn>
    </template>
    <div style="display: flex; position: relative;">
      <img :src="imgSrc" style="object-fit: contain; width: 100%; cursor: pointer;" @click="play">
      <video autoplay ref="video" playsinline
        style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: black; object-fit: fill;"
        :style="{ zIndex: playing ? 1 : -1 }" @click="stop"></video>
    </div>
  </v-card>
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectPluginClient, connectedClient, fixupAppDomainImageUrl } from '@/common/client';
import { getFaPrefix } from '@/device-icons';
import { getDeviceFromId } from '@/id-device';
import { BrowserSignalingSession } from '@scrypted/common/src/rtc-signaling';
import { Camera, MediaStreamDestination, RTCSessionControl, RTCSignalingChannel, ScryptedInterface, ScryptedMimeTypes, VideoCamera } from '@scrypted/types';
import { computed, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
  id: string;
}>();
const device = getDeviceFromId<Camera & RTCSignalingChannel & VideoCamera>(() => props.id);
watch(() => device.value, () => stop());

const destination = ref<MediaStreamDestination>('Default' as any);
const destinations: MediaStreamDestination[] = [
  'Default' as any,
  'local',
  'local-recorder',
  'remote',
  'low-resolution',
  'remote-recorder',
];

const hasRTC = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.RTCSignalingChannel);
});


let pc: Promise<RTCPeerConnection> | undefined;
function cleanupPeerConnection() {
  pc?.then(pc => pc.close()).catch(() => { });
  pc = undefined;
}

onUnmounted(() => cleanupPeerConnection());

const video = ref<HTMLVideoElement>();
const playing = ref(false);
async function play() {
  if (playing.value)
    return;
  if (!device.value)
    return;
  playing.value = true;

  cleanupPeerConnection();

  const session = new BrowserSignalingSession();
  pc = session.pcDeferred.promise;

  const mediaStream = new MediaStream();
  session.onPeerConnection = async pc => {
    pc.ontrack = e => {
      console.log('add track', e.track);
      mediaStream.addTrack(e.track);
    }
  };
  let control: RTCSessionControl;
  if (destination.value === 'Default' as any) {
    control = (await device.value.startRTCSignalingSession(session))!;
  }
  else {
    const mo = await device.value.getVideoStream({ destination: destination.value });
    const { mediaManager } = connectedClient.value || await connectPluginClient();
    const channel = await mediaManager.convertMediaObject<RTCSignalingChannel>(mo, ScryptedMimeTypes.RTCSignalingChannel);
    control = (await channel.startRTCSignalingSession(session))!;
  }
  session.pcDeferred.promise.then(pc => {
    pc.addEventListener('iceconnectionstatechange', () => {
      console.log('iceConnectionStateChange', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected'
        || pc.iceConnectionState === 'failed'
        || pc.iceConnectionState === 'closed') {
        control.endSession();
      }
    });
  });

  video.value!.srcObject = mediaStream;
}

function stop() {
  if (!playing.value)
    return;
  playing.value = false;
  cleanupPeerConnection();
}

const counter = ref(0);

const imgSrc = asyncComputed({
  async get({ clearOldValue }, ov: string, nwv, owv, w) {
    const d = device.value;
    if (!d) {
      clearOldValue();
      return;
    }
    // route/device change, old value is from another camera
    if (w === 'device')
      clearOldValue();
    const mo = await d.takePicture({
      reason: 'event',
    });
    const { mediaManager } = connectedClient.value || await connectPluginClient();
    const url = await mediaManager.convertMediaObjectToLocalUrl(mo, 'image/jpeg');
    return fixupAppDomainImageUrl(new URL(url).pathname);
  },
  default(previousValue) {
    return previousValue as string || 'img/scrypted/240x135-000000ff.png';
  },
  watch: {
    device: () => device.value,
    counter: () => counter.value,
  }
});
</script>
