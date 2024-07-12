<script setup lang="ts">
import { getFaPrefix } from '@/device-icons';
</script>

<template>
  <v-card
    text="Plugins are the primary way to extend Scrypted. Plugins can add new devices and capabilities. Install Plugins created by Scrypted and other developers.">
    <template v-slot:prepend>
      <v-icon size="x-small">{{ getFaPrefix('fa-puzzle-piece') }}</v-icon>
    </template>
    <template v-slot:title>
      <v-card-subtitle class="mt-1">Install Plugins</v-card-subtitle>
    </template>
    <v-card-actions>
      <v-btn color="primary" to="/component/plugin/install">Install Plugins</v-btn>
    </v-card-actions>
  </v-card>
</template>
