<template>
  <v-navigation-drawer @update:model-value="emits('update:modelValue', $event)" :model-value="modelValue" app clipped
    fixed :rail="!isTouchDevice" :permanent="!isTouchDevice">
    <v-list density="compact" nav>
      <template v-for="(itemGroup, index) of itemGroups" :key="itemGroup.title">
        <v-list-subheader v-if="itemGroup.title && isTouchDevice">{{ itemGroup.title }}</v-list-subheader>
        <v-divider v-if="itemGroup.title && !isTouchDevice"></v-divider>
        <v-list-item v-for="item of itemGroup.items" link :href="item.href" :target="item.target" :to="item.to"
          :active="item.active?.()" :title="item.title" :prepend-icon="item.icon">
          <v-tooltip v-if="!isTouchDevice" activator="parent" location="end">{{ item.title }}</v-tooltip>
        </v-list-item>
        <v-divider v-if="index"></v-divider>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>
<script setup lang="ts">
import { isTouchDevice } from '@/common/size';
import { getFaPrefix } from '@/device-icons';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

defineProps<{
  modelValue: boolean;
}>();

const emits = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

const route = useRoute();

const routeName = computed(() => {
  return route.name;
})

interface ItemGroup {
  title: string | undefined;
  items: {
    title: string;
    icon: string;
    href?: string;
    to?: string;
    target?: string;
    active?: () => boolean;
  }[];
}

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
      { title: 'Settings', icon: getFaPrefix('fa-gear'), to: '/settings' },
      { title: 'Documentation', icon: getFaPrefix('fa-book'), href: 'https://docs.scrypted.app', target: "_blank" },
    ]
  },
  {
    title: 'Community',
    items: [
      { title: 'Discord', icon: 'fa-brands fa-discord', href: 'https://discord.gg/DcFzmBHYGq', target: '_blank' },
      { title: 'Reddit', icon: 'fa-brands fa-reddit-alien', href: 'https://www.reddit.com/r/Scrypted', target: '_blank' },
    ]
  },
];
</script>
