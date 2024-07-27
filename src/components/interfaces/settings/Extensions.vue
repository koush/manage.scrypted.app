<template>
  <div>
    <v-list v-if="extensions.length" density="compact" style="overflow: hidden;">
      <v-list-subheader>Modify and extend devices capabilities.</v-list-subheader>
      <template v-for="extension in extensions">
        <v-list-item style="height: 36px;">
          <template v-slot:title>
            <v-switch inset density="compact" class="shrink" :color="chipColor" hide-details
              :model-value="extension.value" @update:model-value="v => toggleMixin(extension, v)">
              <template v-slot:label>
                <div class="ml-4" style="font-size: 1.5rem;">{{ extension.device.name }}</div>
              </template>

            </v-switch>
          </template>
          <template v-slot:append>
            <v-btn size="x-small" variant="text" @click="goDevice(router, extension.device)">
              <v-icon>{{ getFaPrefix('fa-arrow-up-right-from-square') }}</v-icon>
            </v-btn>
          </template>
        </v-list-item>
        <v-divider></v-divider>
      </template>
    </v-list>
    <div v-else>
      <v-card-text>No extensions available.</v-card-text>
    </div>
  </div>
</template>
<script setup lang="ts">
import { connectedClient } from '@/common/client';
import { getFaPrefix } from '@/device-icons';
import { getDeviceFromId, goDevice } from '@/id-device';
import { MixinProvider, ScryptedDevice, ScryptedInterface } from '@scrypted/types';
import { useRouter } from 'vue-router';
import { chipColor } from '../settings-common';
import { computed } from 'vue';
import { asyncComputed } from '@/common/async-computed';
import { getAllDevices } from '@/common/devices';
import { timeoutPromise } from '@scrypted/common/src/promise-utils';
import { watch } from 'vue';

const router = useRouter();

const props = defineProps<{
  id: string
}>();

const device = getDeviceFromId<ScryptedDevice>(() => props.id);

async function toggleMixin(extension: typeof extensions.value[0], state: boolean) {
  extension.value = state;
  const mixins = device.value.mixins.filter(m => m !== extension.device.id);
  if (state)
    mixins.push(extension.device.id);
  await device.value.setMixins(mixins);
}

const enabledExtensions = computed(() => {
  return (device.value?.mixins || []).map(m => {
    const mixin = connectedClient.value!.systemManager.getDeviceById<MixinProvider>(m);
    return mixin;
  })
    .filter(m => !!m);
});

const availableExtensions = asyncComputed({
  async get() {
    const mixinProviders = getAllDevices<MixinProvider>().filter(d => d.interfaces.includes(ScryptedInterface.MixinProvider));
    const promises = mixinProviders.map(async m => await m.canMixin(device.value.type, device.value.interfaces) ? m : undefined);
    const settled = await Promise.allSettled(promises.map(p => timeoutPromise(2000, p)));
    const valid = settled.map(v => v.status === 'fulfilled' && v.value).filter(v => !!v);
    return valid;
  },
  default: [],
  watch: {
    device: () => device.value,
  },
});

let initialExtensions: typeof extensions.value;
watch(() => props.id, () => initialExtensions = undefined);

const extensions = computed(() => {
  const merged = new Map<string, typeof enabledExtensions.value[0]>();
  for (const e of enabledExtensions.value) {
    merged.set(e.id, e);
  }
  for (const e of availableExtensions.value) {
    merged.set(e.id, e);
  }
  const ret = [...merged.values()].map(d => ({
    device: d,
    value: !!enabledExtensions.value.find(c => c.id === d.id),
  }));

  if (!initialExtensions) {
    initialExtensions = ret;
    return ret;
  }

  ret.sort((a, b) => {
    const ai = initialExtensions.findIndex(e => e.device.id === a.device.id);
    const bi = initialExtensions.findIndex(e => e.device.id === b.device.id);
    if (ai === -1 && bi === -1)
      return a.device.name.localeCompare(b.device.name);
    if (ai === -1)
      return 1;
    if (bi === -1)
      return -1;
    return ai - bi;
  });

  return ret;
});

</script>
<style scoped>
.shrink {
  transform: scale(.5, .5);
  transform-origin: 0% 50%;
  width: 200%;
}
</style>
