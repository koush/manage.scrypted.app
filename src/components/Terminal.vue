<template>
  <v-container fluid>
    <PtyComponent title="Terminal" native-id="terminalservice" control :style="{ display: 'flex', flexDirection: 'column', height: '100%' }"></PtyComponent>
  </v-container>
</template>
<script setup lang="ts">
import PtyComponent from "@/components/PtyComponent.vue";

</script>
