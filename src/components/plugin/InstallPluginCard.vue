<script setup lang="ts">
import { getFaPrefix } from '@/device-icons';
</script>

<template>
  <v-card
    text="Plugins are the primary way to extend Scrypted. Plugins can add new devices and capabilities. Install Plugins created by Scrypted and other developers."
    :prepend-icon="getFaPrefix('fa-puzzle-piece')" title="Install Plugins">
    <v-card-actions>
      <v-btn color="primary" to="/component/plugin/install">Install Plugins</v-btn>
    </v-card-actions>
  </v-card>
</template>
