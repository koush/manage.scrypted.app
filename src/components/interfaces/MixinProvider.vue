<template>
  <v-card>
    <template v-slot:prepend>
      <v-icon size="xx-small">{{ getFaPrefix('fa-bolt') }}</v-icon>
    </template>
    <template v-slot:title>
      <v-card-subtitle class="pt-1 pl-4" style="text-transform: uppercase;">
        Extending Devices
      </v-card-subtitle>
    </template>
    <v-card-subtitle>
      {{ device.name }} can be enabled on these devices.
    </v-card-subtitle>
    <v-table density="compact">
      <thead>
        <tr>
          <th class="text-left">
            Name
          </th>
          <th class="text-left" v-if="mdAndUp && showModel">Model</th>
          <th class="text-left" v-if="mdAndUp && showIp">IP</th>
          <th style="width: 32px;"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="mixined in mixinList" :key="mixined.device.id">
          <td>
            <v-switch inset density="compact" class="shrink" :color="chipColor" hide-details
              :model-value="mixined.value" @update:model-value="v => toggleMixin(mixined, v)">
              <template v-slot:label>
                <div class="ml-4" style="font-size: 1.5rem;">{{ mixined.device.name }}</div>
              </template>
            </v-switch>
          </td>
          <td v-if="mdAndUp && showModel">{{ mixined.device.info?.model }}</td>
          <td v-if="mdAndUp && showIp">{{ mixined.device.info?.ip }}</td>
          <td><v-btn variant="text" size="x-small" :to="getDeviceRoute(mixined.device.id)"
              :icon="typeToIcon(mixined.device.type)"></v-btn></td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { getAllDevices } from '@/common/devices';
import { getFaPrefix, typeToIcon } from '@/device-icons';
import { getDeviceFromId, getDeviceRoute } from '@/id-device';
import { timeoutPromise } from '@scrypted/common/src/promise-utils';
import { MixinProvider } from '@scrypted/types';
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import { chipColor } from './settings-common';

const { mdAndUp } = useDisplay()

const props = defineProps<{
  id: string;
}>();

const device = getDeviceFromId<MixinProvider>(() => props.id);

const extendedDevices = computed(() => {
  return getAllDevices()
    .filter(d => d.mixins?.includes(props.id));
});

const extensibleDevices = asyncComputed({
  async get() {
    const promises = getAllDevices().map(async m => await device.value.canMixin(m.type, m.interfaces) ? m : undefined);
    const settled = await Promise.allSettled(promises.map(p => timeoutPromise(2000, p)));
    const valid = settled.map(v => v.status === 'fulfilled' && v.value).filter(v => !!v);
    return valid;
  },
  default: [],
  watch: {
    device: () => device.value,
  },
});


const mixinList = computed(() => {
  const merged = new Map<string, typeof extendedDevices.value[0]>();
  for (const e of extendedDevices.value) {
    merged.set(e.id, e);
  }
  for (const e of extensibleDevices.value) {
    merged.set(e.id, e);
  }
  const ret = [...merged.values()].map(d => ({
    device: d,
    value: !!extendedDevices.value.find(c => c.id === d.id),
  }));
  return ret;
});

async function toggleMixin(mixined: typeof mixinList.value[0], state: boolean) {
  mixined.value = state;
  const mixins = mixined.device.mixins.filter(m => m !== props.id);
  if (state)
    mixins.push(props.id);
  await mixined.device.setMixins(mixins);
}

const showModel = computed(() => {
  return mixinList.value.some(d => d.device.info?.model);
});

const showIp = computed(() => {
  return mixinList.value.some(d => d.device.info?.ip);
});

</script>
<style scoped>
.shrink {
  transform: scale(.5, .5);
  transform-origin: 0% 50%;
}
</style>
