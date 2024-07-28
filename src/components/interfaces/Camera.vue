<template>
  <v-card>
    <template v-if="slots.prepend" v-slot:prepend>
      <slot name="prepend"></slot>
    </template>
    <template v-if="slots.append" v-slot:append>
      <slot name="append"></slot>
    </template>
    <template v-slot:append v-if="!hideRefresh">
      <ToolbarTooltipButton :icon="getFaPrefix('fa-refresh')" variant="text" size="small" @click="counter++"
        tooltip="Refresh"></ToolbarTooltipButton>
    </template>
    <div style="display: flex; position: relative;">
      <slot></slot>
      <img :src="imgSrc" style="object-fit: contain; width: 100%;" :style="clickable ? 'cursor: pointer' : undefined" @click="emits('img:click')">
    </div>
  </v-card>
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectPluginClient, connectedClient, fixupAppDomainImageUrl } from '@/common/client';
import { getFaPrefix } from '@/device-icons';
import { getDeviceFromId, registerListener } from '@/id-device';
import { Camera, ScryptedInterface } from '@scrypted/types';
import { ref, useSlots } from 'vue';
import ToolbarTooltipButton from '../ToolbarTooltipButton.vue';
import debounce from 'lodash/debounce';

const props = defineProps<{
  id: string;
  hideRefresh?: boolean;
  clickable?: boolean;
}>();
const emits = defineEmits<{
  (event: 'img:click'): void;
}>();
const slots = useSlots();

const device = getDeviceFromId<Camera>(() => props.id);

const counter = ref(0);

const imgSrc = asyncComputed({
  async get({ clearOldValue }, ov: string, nwv, owv, w) {
    const d = device.value;
    if (!d) {
      clearOldValue();
      return 'img/scrypted/240x135-000000ff.png';
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

const refreshOnSettings = debounce(() => counter.value++, 1000, {
  leading: true,
  trailing: true,
});

registerListener(device, {
  event: ScryptedInterface.Settings,
}, () => {
  refreshOnSettings();
});

</script>
