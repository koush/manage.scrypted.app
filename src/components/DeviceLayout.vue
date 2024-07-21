<template>
  <v-col cols="12" md="8" xl="6">
    <slot name="default"></slot>
    <slot name="extra" v-if="!xlAndUp"></slot>
  </v-col>
  <v-col v-if="xlAndUp" cols="3">
    <slot name="extra" v-if="xlAndUp"></slot>
  </v-col>
</template>
<script setup lang="ts">
import { useDisplay } from 'vuetify';

const { xlAndUp } = useDisplay();

</script>
