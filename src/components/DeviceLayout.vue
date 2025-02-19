<template>
  <ResponsiveColumn cols="12" md="8" xl="6" v-if="!hideDefault || (!xlAndUp && !hideExtra)">
    <slot name="default" v-if="!hideDefault"></slot>
    <slot name="extra" v-if="!xlAndUp && !hideExtra"></slot>
  </ResponsiveColumn>
  <ResponsiveColumn v-if="xlAndUp && !hideExtra" cols="3">
    <slot name="extra"></slot>
  </ResponsiveColumn>
</template>
<script setup lang="ts">
import { useDisplay } from 'vuetify';

const { xlAndUp } = useDisplay();

defineProps<{
  hideDefault?: boolean;
  hideExtra?: boolean;
}>();

</script>
