<template>
  <v-navigation-drawer @update:model-value="emits('update:modelValue', $event)" :model-value="modelValue" app clipped
    fixed :rail="!isTouchDevice" :permanent="!isTouchDevice">
    <v-list density="compact" nav>
      <template v-for="(itemGroup, index) of itemGroups" :key="itemGroup.title">
        <v-list-subheader v-if="itemGroup.title && isTouchDevice">{{ itemGroup.title }}</v-list-subheader>
        <v-divider v-if="itemGroup.title && !isTouchDevice"></v-divider>
        <v-list-item v-for="item of itemGroup.items" link :href="item.href" :target="item.target" :to="item.to"
          @click="item.click" :active="item.active?.()" :title="item.title">
          <template v-slot:prepend>
            <template v-if="item.badge">
              <v-badge color="error" :content="item.badge">
                <v-icon>{{ item.icon }}</v-icon>
              </v-badge>
            </template>
            <v-icon v-else>{{ item.icon }}</v-icon>
          </template>
          <v-tooltip v-if="!isTouchDevice" activator="parent" location="end">{{ item.title }}</v-tooltip>
        </v-list-item>
        <v-divider v-if="index"></v-divider>
      </template>
    </v-list>
  </v-navigation-drawer>
  <v-dialog v-model="showAlerts" v-if="currentAlert" location="center" max-width="400">
    <v-card color="error" :prepend-icon="alertIcon">
      <template v-slot:title>
        <v-card-title>{{ currentAlert.title }}</v-card-title>
      </template>
      <template v-slot:append>
        <v-btn variant="text" :disabled="!alertIndex" @click="alertIndex--"
          :icon="getFaPrefix('fa-arrow-left')"></v-btn>
        <v-btn variant="text" :disabled="alertIndex >= scryptedAlerts.length - 1" @click="alertIndex++"
          :icon="getFaPrefix('fa-arrow-right')"></v-btn>
      </template>
      <v-card-text>{{ currentAlert.message }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="removeAlert(currentAlert)">Dismiss</v-btn>
        <v-btn :to="alertDeviceId ? getDeviceRoute(alertDeviceId) : undefined" @click="showAlerts = false">View</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { connectedClient } from '@/common/client';
import { isTouchDevice } from '@/common/size';
import { getFaPrefix, typeToIcon } from '@/device-icons';
import { getDeviceRoute } from '@/id-device';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { removeAlert, scryptedAlerts } from './plugin/plugin-apis';

defineProps<{
  modelValue: boolean;
}>();

const emits = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

const route = useRoute();

const routeName = computed(() => {
  return route.name;
});

const alertIndex = ref(0);
const showAlerts = ref(false);
watch(() => showAlerts.value, () => alertIndex.value = 0);

const currentAlert = computed(() => {
  return scryptedAlerts.value[alertIndex.value];
});

// dismissing the alert will remove the dialog before unsetting showAlerts.
watch(() => currentAlert.value, () => {
  if (!currentAlert.value)
    showAlerts.value = false;
});

const alertDeviceId = computed(() => {
  const d = '/device/';
  if (!currentAlert.value?.path.startsWith(d))
    return;
  const id = currentAlert.value.path.substring(d.length);
  return id;
});

const alertIcon = computed(() => {
  if (!alertDeviceId.value)
    return;
  const device = connectedClient?.value.systemManager.getDeviceById(alertDeviceId.value);
  if (!device)
    return;
  return typeToIcon(device.type);
});

interface ItemGroup {
  title: string | undefined;
  items: {
    title: string;
    icon: string;
    href?: string;
    to?: string;
    target?: string;
    badge?: string;
    click?: () => void;
    active?: () => boolean;
  }[];
}

const itemGroups = computed(() => {
  const itemGroups: ItemGroup[] = [
    {
      title: undefined,
      items: [
        { title: 'Devices', icon: getFaPrefix('fa-house-signal'), to: '/device', active: () => routeName.value === 'Device' || routeName.value === 'DeviceList' },
        { title: 'Plugins', icon: getFaPrefix('fa-puzzle'), to: '/component/plugin' },
      ]
    },
    {
      title: 'Utilities',
      items: [
        { title: 'Users', icon: getFaPrefix('fa-users'), to: '/users' },
        { title: 'Terminal', icon: getFaPrefix('fa-rectangle-terminal'), to: '/component/shell' },
        ...(scryptedAlerts.value.length
          ? [
            {
              title: 'Alerts',
              icon: getFaPrefix('fa-message-exclamation'),
              click: () => {
                showAlerts.value = true;
              },
              badge: scryptedAlerts.value.length.toString()
            }
          ]
          : []),
        { title: 'Settings', icon: getFaPrefix('fa-gear'), to: '/settings' },
      ]
    },
    {
      title: 'Community',
      items: [
        { title: 'Documentation', icon: getFaPrefix('fa-book'), href: 'https://docs.scrypted.app', target: "_blank" },
        { title: 'Discord', icon: 'fa-brands fa-discord', href: 'https://discord.gg/DcFzmBHYGq', target: '_blank' },
        { title: 'Reddit', icon: 'fa-brands fa-reddit-alien', href: 'https://www.reddit.com/r/Scrypted', target: '_blank' },
      ]
    },
  ];
  return itemGroups;
})
</script>
