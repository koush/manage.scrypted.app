<template>
  <video autoplay ref="video" playsinline style="background: black; object-fit: fill;"></video>
</template>
<script setup lang="ts">
import { connectedClient, connectPluginClient } from '@/common/client';
import { getDeviceFromId } from '@/util/id-device';
import { BrowserSignalingSession } from '@scrypted/common/src/rtc-signaling';
import { Camera, MediaStreamDestination, RTCSessionControl, RTCSignalingChannel, ScryptedMimeTypes, VideoCamera } from '@scrypted/types';
import { onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
  id: string;
  destination?: MediaStreamDestination | 'Default';
  microphone?: boolean;
}>();

const device = getDeviceFromId<Camera & RTCSignalingChannel & VideoCamera>(() => props.id);
watch(() => props.id, () => cleanupPeerConnection());

let pc: Promise<RTCPeerConnection> | undefined;
let session: BrowserSignalingSession;
let control: RTCSessionControl;
function cleanupPeerConnection() {
  control?.endSession();
  control = undefined;
  session?.close();
  session = undefined;
  playing.value = false;
  pc?.then(pc => pc.close()).catch(() => { });
  pc = undefined;
}

onUnmounted(() => cleanupPeerConnection());

const playing = ref(false);

const video = ref<HTMLVideoElement>();
async function play() {
  if (!playing.value)
    return;
  if (!device.value)
    return;
  if (!video.value)
    return;

  cleanupPeerConnection();
  // unsets the playing state
  playing.value = true;

  session = new BrowserSignalingSession();
  pc = session.pcDeferred.promise;

  const mediaStream = new MediaStream();
  session.onPeerConnection = async pc => {
    pc.ontrack = e => {
      console.log('add track', e.track);
      mediaStream.addTrack(e.track);
    }
  };

  if (props.destination === 'Default') {
    control = (await device.value.startRTCSignalingSession(session))!;
  }
  else {
    const mo = await device.value.getVideoStream({
      destination: props.destination,
      // these properties are necessary to ensure adaptive bitrate transcodes when necessary.
      destinationId: 'management',
      video: {
        codec: 'h264',
      }
    });
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

watch(() => video.value, () => {
  if (video.value && playing.value)
    play();
});

watch(() => props.destination, () => {
  if (props.destination) {
    playing.value = true;
    play();
  }
  else {
    cleanupPeerConnection();
  }
});

if (props.destination) {
  playing.value = true;
  play();
}

function setMicrophone() {
  if (!control)
    return;
  control.setPlayback({
    audio: !!props.microphone,
    video: true,
  });
  session?.setMicrophone(!!props.microphone);
}

setMicrophone();
watch(() => props.microphone, () => setMicrophone());

</script>
