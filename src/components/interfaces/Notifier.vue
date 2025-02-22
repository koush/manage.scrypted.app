<template>
  <v-card>
    <template v-slot:prepend>
      <v-icon size="xx-small">{{ getFaPrefix('fa-message') }}</v-icon>
    </template>
    <template v-slot:title>
      <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
        Send Notification
      </v-card-subtitle>
    </template>

    <div class="mr-8 ml-8">
      <v-text-field v-model="title" class="mb-4 shrink" density="compact" hide-details persistent-placeholder
        label="Title" variant="outlined"></v-text-field>
      <v-text-field v-model="subtitle" class="mb-4 shrink" density="compact" hide-details persistent-placeholder
        label="Subtitle" variant="outlined"></v-text-field>
      <v-text-field v-model="body" class="mb-4 shrink" density="compact" hide-details persistent-placeholder
        label="Body" variant="outlined"></v-text-field>

      <v-radio-group class="shrink" v-model="radios" inline color="info">
        <template v-slot:label>
          <div>MediaSource</div>
        </template>
        <v-radio value="url" label="URL">
        </v-radio>
        <v-radio value="media" label="Device Media Source">
        </v-radio>
      </v-radio-group>

      <v-text-field v-if="radios === 'url'" v-model="url" class="shrink mb-4" density="compact" persistent-placeholder
        label="Media URL" variant="outlined" persistent-hint
        hint="The URL that contains an image or video."></v-text-field>
      <DeviceInterfaceSetting v-else persistent-hint hint="The camera or media source used to send an image or video."
        v-model="mediaSetting" class="mb-4"></DeviceInterfaceSetting>
    </div>
    <v-alert v-if="error" color="error" class="ma-4">{{ error }}</v-alert>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn size="small" color="info" :prepend-icon="getFaPrefix('fa-paper-plane-top')"
        @click="sendNotification">Send</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { getFaPrefix } from '@/device-icons';
import { Camera, MediaObject, Notifier, ScryptedInterface, Setting, VideoCamera } from '@scrypted/types';
import DeviceInterfaceSetting from './settings/DeviceInterfaceSetting.vue';
import { ref } from 'vue';
import { getDeviceFromId } from '@/id-device';
import { connectedClient } from '@/common/client';

const props = defineProps<{
  id: string;
}>();

const device = getDeviceFromId<Notifier>(() => props.id);

const mediaSetting = ref<Setting>({
  title: 'Device Media Source',
  description: 'Select a device to use as the media source.',
  type: 'interface',
  deviceFilter: `deviceInterface === '${ScryptedInterface.VideoCamera}' || deviceInterface === '${ScryptedInterface.Camera}'`,
});

const radios = ref('url');
const title = ref('Scrypted');
const subtitle = ref('Test Notification');
const body = ref('This is a message from the Scrypted Management Console.');
const url = ref<string>('https://home.scrypted.app/_punch/web_hi_res_512.png');
const error = ref<string>();

async function sendNotification() {
  try {
    error.value = undefined;

    let urlOrMediaObject: string | MediaObject;
    if (radios.value === 'url') {
      urlOrMediaObject = url.value || undefined;
    }
    else {
      const deviceInterface = mediaSetting.value.value?.toString();
      if (deviceInterface) {
        const [id, iface] = deviceInterface.split('#');
        const mediaDevice = connectedClient.value.systemManager.getDeviceById<Camera & VideoCamera>(id);
        if (iface === ScryptedInterface.Camera) {
          urlOrMediaObject = await mediaDevice.takePicture({
            reason: 'event',
          });
        }
        else if (iface === ScryptedInterface.VideoCamera) {
          urlOrMediaObject = await mediaDevice.getVideoStream();
        }
      }
    }

    await device.value.sendNotification(title.value || undefined, {
      subtitle: subtitle.value || undefined,
      body: body.value || undefined,
    }, urlOrMediaObject);
  }
  catch (e) {
    console.error('notification send error', e);
    error.value = (e as Error).message;
  }
}

</script>
<style scoped>
.shrink {
  transform: scale(.8, .8);
  width: 125%;
  transform-origin: 0% 50%;
}
</style>
