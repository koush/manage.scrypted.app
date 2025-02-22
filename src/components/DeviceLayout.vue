<template>
  <ResponsiveColumn cols="12" md="8" :xl="hideExtra ? 8 : 6" v-if="!hideDefault || (!xlAndUp && !hideExtra)">
    <slot name="default" v-if="!hideDefault"></slot>
    <slot name="extra" v-if="!xlAndUp && !hideExtra"></slot>
  </ResponsiveColumn>
  <ResponsiveColumn v-if="xlAndUp && !hideExtra" :cols="hideDefault ? 6 : 3">
    <slot name="extra"></slot>
  </ResponsiveColumn>
</template>
<script setup lang="ts">
import { useDisplay } from 'vuetify';
import ResponsiveColumn from './ResponsiveColumn.vue';

const { xlAndUp } = useDisplay();

defineProps<{
  hideDefault?: boolean;
  hideExtra?: boolean;
}>();

</script>
