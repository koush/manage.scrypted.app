<template>
  <v-app-bar app clipped-left color="deep-purple accent-4">
    <v-app-bar-nav-icon variant="text" :icon="getFaPrefix('fa-bars')" @click="emits('update:modelValue', !modelValue)"
      class="mt-1"></v-app-bar-nav-icon>
    <v-toolbar-title class="scrypted-title mr-4" style="flex: none;"><a class="hide-link"
        href="#/">Scrypted</a></v-toolbar-title>
    <div v-if="connectedClient?.serverVersion && !isTouchPhone" class="pt-1" style="color: lightgrey">v{{
      connectedClient?.serverVersion }}</div>
    <v-spacer></v-spacer>
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
import { isTouchPhone } from '@/common/size';
import ThemeToggle from '../common/components/ThemeToggle.vue';
import { getFaPrefix } from '@/device-icons';

defineProps<{
  modelValue: boolean;
}>();

const emits = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();
</script>
<style scoped>
.hide-link {
  text-decoration: none;
  color: inherit;
}
</style>
