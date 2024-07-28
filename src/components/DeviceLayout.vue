<template>
  <ResponsiveColumn cols="12" md="8" xl="6">
    <slot name="default"></slot>
    <slot name="extra" v-if="!xlAndUp"></slot>
  </ResponsiveColumn>
  <ResponsiveColumn v-if="xlAndUp" cols="3">
    <slot name="extra" v-if="xlAndUp"></slot>
  </ResponsiveColumn>
</template>
<script setup lang="ts">
import { useDisplay } from 'vuetify';

const { xlAndUp } = useDisplay();

</script>
