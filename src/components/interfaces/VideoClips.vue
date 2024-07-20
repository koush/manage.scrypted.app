<template>
  <v-card v-if="hasVideoClips || couldRecord">
    <template v-slot:prepend>
      <v-icon size="xx-small">{{ getFaPrefix('fa-clapperboard-play') }}</v-icon>
    </template>

    <template v-slot:append v-if="hasVideoClips">
      <ToolbarTooltipButton v-if="hasSmartDetections" :active="smartDetectionsOnly"
        @click="smartDetectionsOnly = !smartDetectionsOnly" tooltip="Filter unidentified motion" icon="fa-wind"
        variant="text" :color="smartDetectionsOnly ? 'info' : undefined"></ToolbarTooltipButton>
      <v-dialog width="unset" v-model="dialog">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" size="small" variant="text">
            <v-icon x-small>{{ getFaPrefix('fa-calendar-alt') }}</v-icon>
            &nbsp;
            {{ new Date(date).getFullYear() }}-{{ new Date(date).getMonth() + 1 }}-{{ new Date(date).getDate() }}
          </v-btn>
        </template>
        <v-card>
          <V2DatePicker :is-dark="dark" mode="date" :model-value="new Date(date)"
            @update:model-value="(v: Date) => date = v.getTime()"></V2DatePicker>
        </v-card>
      </v-dialog>
    </template>

    <template v-slot:title>
      <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
        Recorded Clips
      </v-card-subtitle>
    </template>

    <template v-if="hasVideoClips">
      <v-divider></v-divider>
      <div ref="container" style="width: 100%;">
        <v-virtual-scroll class="container" :height="isTouchPhone ? 200 : 400" :items="clipRows" :item-height="80">
          <template v-slot:default="{ item: row }">
            <div style="display: flex;">
              <template v-for="(item, index) in row">
                <v-divider v-if="index" vertical></v-divider>
                <div :style="`width: ${100 / clipColumnCount}%`"
                  style="display: flex; height: 80px; font-size: .8rem; cursor: pointer;" class="pa-2"
                  @click="emits('click:clip', item)">
                  <img :src="fixupAppDomainImageUrl(item.resources?.thumbnail?.href)"
                    style="aspect-ratio: 16/9; object-fit: cover;" class="rounded-lg">
                  <div class="ml-2">
                    <div style="font-weight: 550;">
                      {{ new Date(item.startTime).toLocaleTimeString() }}
                    </div>
                    <div>{{ toDurationString(item.duration) }}</div>
                    <div v-if="item.detectionClasses?.length">
                      {{ item.detectionClasses.join(', ') }}
                    </div>
                  </div>
                </div>
              </template>
            </div>
            <v-divider></v-divider>
          </template>
        </v-virtual-scroll>
      </div>
    </template>
    <template v-else>
      <v-card-text>This camera is not recording or the recordings are unavailable in Scrypted. Upgrade to Scrypted NVR
        for 24/7 recording.</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn size="small" href="https://demo.scrypted.app/#/demo" target="_blank" color="info">View Demo</v-btn>
      </v-card-actions>
    </template>
  </v-card>
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { fixupAppDomainImageUrl } from '@/common/client';
import { isDark } from '@/common/colors';
import { observeResize } from '@/common/resize-observer';
import { isTouchPhone } from '@/common/size';
import { getFaPrefix } from '@/device-icons';
import { getDeviceFromId } from '@/id-device';
import { ScryptedInterface, VideoClip, VideoClips } from '@scrypted/types';
import { computed, ref } from 'vue';
import ToolbarTooltipButton from '../ToolbarTooltipButton.vue';

const dark = isDark();

const props = defineProps<{
  id: string;
}>();

const container = ref<HTMLDivElement>();
const containerSize = observeResize(container);
const clipColumnCount = computed(() => {
  if (!containerSize.value)
    return 1;
  const ret = Math.max(1, Math.floor(containerSize.value.width / 240));
  console.warn(ret);
  return ret;
});

const emits = defineEmits<{
  (event: 'click:clip', clip: VideoClip): void;
}>();

const dialog = ref(false);
const date = ref(Date.now());

const device = getDeviceFromId<VideoClips>(() => props.id);

const hasSmartDetections = computed(() => {
  return videoClips.value.find(v => v.detectionClasses?.find(d => d !== 'motion'));
});

const smartDetectionsOnly = ref(true);

const videoClips = asyncComputed({
  async get() {
    const clips = await device.value.getVideoClips({
      startTime: date.value - 24 * 60 * 60 * 1000,
    });
    return clips;
  },
  default: [] as VideoClip[],
  watch: {
    device: () => device.value,
    date: () => date.value,
  },
});

const filteredVideoClips = computed(() => {
  if (!hasSmartDetections.value || !smartDetectionsOnly.value)
    return [...videoClips.value].reverse();

  const ret = videoClips.value.filter(v => v.detectionClasses?.find(d => d !== 'motion'));
  return ret.reverse();
});

const clipRows = computed(() => {
  const rows: VideoClip[][] = [];
  // create rows of length clipColumnCount
  for (let i = 0; i < filteredVideoClips.value.length; i += clipColumnCount.value) {
    rows.push(filteredVideoClips.value.slice(i, i + clipColumnCount.value));
  }
  return rows;
});

function modSub(v: number, ...na: number[]) {
  const ret: number[] = [];
  for (const n of na) {
    const m = v % n;
    const r = v - m;
    ret.push(Math.floor(r / n));
    v -= r;
  }

  return ret;
}

function toDurationString(duration: number, padStart = 0) {
  const [days, hours, minutes, seconds] = modSub(duration, 24 * 60 * 60 * 1000, 60 * 60 * 1000, 60 * 1000, 1000);
  let value = '';
  if (days) {
    value += `${days.toString().padStart(padStart, '0')}d`;
  }
  if (hours) {
    value += `${hours.toString().padStart(padStart, '0')}h`;
  }
  if (minutes) {
    value += `${minutes.toString().padStart(padStart, '0')}m`;
  }
  if (seconds) {
    value += `${seconds.toString().padStart(padStart, '0')}s`;
  }
  return value;
}

const hasVideoClips = computed(() => {
  return device.value?.interfaces.includes(ScryptedInterface.VideoClips);
});

const couldRecord = computed(() => {
  const pluginId = device.value.pluginId;
  if (device)
    switch (pluginId) {
      case '@scrypted/reolink':
      case '@scrypted/onvif':
      case '@scrypted/rtsp':
      case '@scrypted/amcrest':
      case '@scrypted/hikvision':
        return true;
    }
});
</script>
<style scoped>
.container {
  -ms-overflow-style: none;
  /* Internet Explorer 10+ */
  scrollbar-width: none;
  /* Firefox */
}

.container::-webkit-scrollbar {
  display: none;
  /* Safari and Chrome */
}
</style>