<template>
  <template v-if="name">
    <v-divider class="mt-2 mb-2"></v-divider>
    <v-list-item-subtitle class="shrink ml-3 mr-3">{{
      name }}</v-list-item-subtitle>
  </template>

  <v-card-actions>
    <v-btn-group density="compact" :color="chipColor" :model-value="state">
      <v-btn v-for="action in actionable" size="x-small" class="ml-0 mr-0"
        :style="action.disabled ? 'cursor: initial;' : undefined" :ripple="!action.disabled"
        :variant="activeAction === action ? 'flat' : (action.disabled ? 'text' : 'outlined')"  @click="action?.click()" :key="action.name"
        :prepend-icon="getFaPrefix(action.icon)" :value="action.value">{{
          action.name
        }}</v-btn>
    </v-btn-group>

    <template v-if="activeAction && !activeAction?.click">
      <v-spacer></v-spacer>
      <v-btn variant="flat" :color="activeAction.color" size="x-small" class="ml-0 mr-0" :active="true" disabled
        :key="activeAction.name" :prepend-icon="getFaPrefix(activeAction.icon)">{{ activeAction.name }}</v-btn>
    </template>
  </v-card-actions>
</template>
<script setup lang="ts">
import { getFaPrefix } from '@/util/device-icons';
import { computed } from 'vue';
import { chipColor } from '../settings-common';

const props = defineProps<{
  name?: string;
  state: any;
  states: {
    name: string;
    icon: string;
    value: any;
    default?: boolean;
    disabled?: boolean;
    click?: () => void;
    color?: string;
  }[];
}>();

const actionable = computed(() => props.states.filter(s => s.click));
const activeAction = computed(() => props.states.find(s => s.value === props.state) || props.states.find(s => s.default));
</script>
