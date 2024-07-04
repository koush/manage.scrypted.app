<template>
  <v-container fluid>
    <v-row >
      <v-col cols="12">
        <PtyComponent title= "Terminal" native-id="terminalservice" control></PtyComponent>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import PtyComponent from "@/components/PtyComponent.vue";

</script>
