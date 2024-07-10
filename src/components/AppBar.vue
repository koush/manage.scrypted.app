<template>
  <v-app-bar app clipped-left color="deep-purple accent-4">
    <v-app-bar-nav-icon variant="text" :icon="getFaPrefix('fa-bars')" @click="emits('update:modelValue', !modelValue)"
      class="mt-1"></v-app-bar-nav-icon>
    <v-toolbar-title class="scrypted-title mr-4" style="flex: none;"><a class="hide-link"
        href="#/">Scrypted</a></v-toolbar-title>
    <div v-if="connectedClient?.serverVersion && !isTouchPhone" class="pt-1" style="color: lightgrey">v{{
      connectedClient?.serverVersion }}</div>
    <v-spacer></v-spacer>
    <v-autocomplete v-if="!isTouchDevice" @update:search="v => search = v" :items="choices" hide-details return-object
      persistent-placeholder label="Search" variant="outlined" density="compact" v-model="value">
      <template v-slot:no-data>
      </template>
      <template v-slot:selection></template>
      <template v-slot:item="{ props, item }">
        <v-list-item v-bind="props" :prepend-icon="typeToIcon(item.raw.value.type)" :subtitle="item.raw.subtitle"
          :title="item.raw.value.name"></v-list-item>
      </template>
    </v-autocomplete>
    <ThemeToggle></ThemeToggle>
    <template v-if="isLoggedIn">
      <!-- <div class="mr-2">{{ connectedClient?.username }}</div> -->
      <v-btn @click="logoutClient">
        <v-icon>{{ getFaPrefix('fa-arrow-right-from-bracket') }}</v-icon>
      </v-btn>
    </template>
  </v-app-bar>
</template>
<script setup lang="ts">
import { connectedClient, isLoggedIn, logoutClient } from '@/common/client';
import { getAllDevices } from '@/common/devices';
import { isTouchDevice, isTouchPhone } from '@/common/size';
import { getFaPrefix, typeToIcon } from '@/device-icons';
import { goDevice } from '@/id-device';
import { ScryptedDevice } from '@scrypted/types';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import ThemeToggle from '../common/components/ThemeToggle.vue';

defineProps<{
  modelValue: boolean;
}>();

const emits = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

interface SearchResult {
  title: string;
  subtitle: string;
  value: ScryptedDevice;
}

const search = ref<string>();

const value = ref<SearchResult>();
const router = useRouter();

watch(() => value.value, async () => {
  if (value.value)
    goDevice(router, value.value.value);
});

const choices = computed(() => {
  if (!connectedClient.value)
    return [];

  const searchLower = search.value?.toLowerCase();

  return getAllDevices().map(d => {

    let subtitle: string;
    if (searchLower) {
      // check various device properties for the search term
      // and set subtitle to the first property that matches.
      if (d.name.toLowerCase().includes(searchLower)) {
        subtitle = d.name;
      }
      else if (d.type.toLowerCase().includes(searchLower)) {
        subtitle = d.type;
      }
      else if (d.pluginId.toLowerCase().includes(searchLower)) {
        subtitle = d.pluginId;
      }
      else if (d.info?.manufacturer?.toLowerCase().includes(searchLower)) {
        subtitle = d.info.manufacturer;
      }
      else if (d.info?.model?.toLowerCase().includes(searchLower)) {
        subtitle = d.info.model;
      }
      else if (d.info?.serialNumber?.toLowerCase().includes(searchLower)) {
        subtitle = d.info.serialNumber;
      }
      else if (d.info?.ip?.toLowerCase().includes(searchLower)) {
        subtitle = d.info.ip;
      }
      else if (d.info?.mac?.toLowerCase().includes(searchLower)) {
        subtitle = d.info.mac;
      }
      else if (d.info?.managementUrl?.toLowerCase().includes(searchLower)) {
        subtitle = d.info.managementUrl;
      }
      else {
      }
    }

    return {
      subtitle,
      title: `${d.name} ${d.type} ${JSON.stringify(d.info || {})} ${d.pluginId}`,
      value: d,
    } as SearchResult;
  })
  // .filter(v => !!v);
});

</script>
<style scoped>
.hide-link {
  text-decoration: none;
  color: inherit;
}
</style>
