<template>
  <v-card>
    <template v-slot:prepend>
      <v-icon size="x-small">{{ getFaPrefix('fa-chart-simple') }}</v-icon>
    </template>
    <template v-slot:title>
      <v-card-subtitle class="mt-1">Plugin Stats</v-card-subtitle>
    </template>

    <v-list>
      <v-list-subheader>RPC Objects</v-list-subheader>
      <v-list-item v-for="top in topRpc">
        <v-progress-linear :color="color" :model-value="top?.info?.rpcObjects"
          :max="max(topRpc.map(t => t.info.rpcObjects))" height="20" rounded>
          <template v-slot:default>
            {{ top?.name }}: {{ top?.info?.rpcObjects }}
          </template>
        </v-progress-linear>
      </v-list-item>
      <v-divider></v-divider>

      <v-list-subheader>Pending Results</v-list-subheader>
      <v-list-item v-for="top in topPending">
        <v-progress-linear :color="color" :model-value="top?.info?.pendingResults"
          :max="max(topRpc.map(t => t.info.pendingResults))" height="20" rounded>
          <template v-slot:default>
            {{ top?.name }}: {{ top?.info?.pendingResults }}
          </template>
        </v-progress-linear>

      </v-list-item>
      <v-divider></v-divider>

      <v-list-subheader>Connections</v-list-subheader>
      <v-list-item v-for="top in topClients">
        <v-progress-linear :color="color" :model-value="top?.info?.clientsCount"
          :max="max(topRpc.map(t => t.info.clientsCount))" height="20" rounded>
          <template v-slot:default>
            {{ top?.name }}: {{ top?.info?.clientsCount }}
          </template>
        </v-progress-linear>
      </v-list-item>
    </v-list>
  </v-card>
</template>
<script setup lang="ts">
import { getFaPrefix } from '@/device-icons';
import { computed } from 'vue';
import { PluginModel } from './plugin-common';
import { max } from 'lodash';
import { isDark } from '@/common/colors';
import { chipColor } from '../interfaces/settings-common';

const dark = isDark();

const color = computed(() => {
  return dark.value ? chipColor : 'light-blue-darken-1';
});

const props = defineProps<{
  plugins: PluginModel[];
}>();

const topRpc = computed(() => {
  return [...props.plugins || []]
    .filter(p => !!p.info?.rpcObjects).sort((a, b) => b.info?.rpcObjects - a.info?.rpcObjects)
    .slice(0, 5);
});

const topPending = computed(() => {
  return [...props.plugins || []]
    .filter(p => !!p.info?.pendingResults).sort((a, b) => b.info?.pendingResults - a.info?.pendingResults)
    .slice(0, 5);
});

const topClients = computed(() => {
  return [...props.plugins || []]
    .filter(p => !!p.info?.clientsCount).sort((a, b) => b.info?.clientsCount - a.info?.clientsCount)
    .slice(0, 5);
});
</script>
<style scoped>
.float-right {
  font-size: .6rem;
  float: right;
}

.bold {
  font-weight: 700;
}

table td {
  border-top: 0px !important;
  border-bottom: 0px !important;

  border-right: 1px solid #000;
}
</style>
