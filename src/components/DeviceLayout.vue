<template>
  <v-col cols="12" md="8" xl="6" :class="isTouchPhone ? 'pa-0' : undefined">
    <slot name="default"></slot>
    <slot name="extra" v-if="!xlAndUp"></slot>
  </v-col>
  <v-col v-if="xlAndUp" cols="3" :class="isTouchPhone ? 'pa-0' : undefined">
    <slot name="extra" v-if="xlAndUp"></slot>
  </v-col>
</template>
<script setup lang="ts">
import { isTouchPhone } from '@/common/size';
import { useDisplay } from 'vuetify';

const { xlAndUp } = useDisplay();

</script>
