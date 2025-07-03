<template>
  <v-card class="mb-2">
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
          :max="Math.max(...topRpc.map(t => t.info.rpcObjects))" height="20" rounded>
          <template v-slot:default>
            {{ top?.name }}: {{ top?.info?.rpcObjects }}
          </template>
        </v-progress-linear>
      </v-list-item>
      <v-divider></v-divider>

      <v-list-subheader>Pending Results</v-list-subheader>
      <v-list-item v-for="top in topPending">
        <v-progress-linear :color="color" :model-value="top?.info?.pendingResults"
          :max="Math.max(...topRpc.map(t => t.info.pendingResults))" height="20" rounded>
          <template v-slot:default>
            {{ top?.name }}: {{ top?.info?.pendingResults }}
          </template>
        </v-progress-linear>

      </v-list-item>
      <v-divider></v-divider>

      <v-list-subheader>Connections</v-list-subheader>
      <v-list-item v-for="top in topClients">
        <v-progress-linear :color="color" :model-value="top?.info?.clientsCount"
          :max="Math.max(...topRpc.map(t => t.info.clientsCount))" height="20" rounded>
          <template v-slot:default>
            {{ top?.name }}: {{ top?.info?.clientsCount }}
          </template>
        </v-progress-linear>
      </v-list-item>
    </v-list>
  </v-card>

  <v-card v-if="clusterWorkers?.length">
    <template v-slot:prepend>
      <v-icon size="x-small">{{ getFaPrefix('fa-circle-nodes') }}</v-icon>
    </template>
    <template v-slot:append>
      <v-btn variant="text" @click="refreshClusters++">
        <v-icon size="x-small">{{ getFaPrefix('fa-refresh') }}</v-icon>
      </v-btn>
    </template>
    <template v-slot:title>
      <v-card-subtitle class="mt-1">Cluster Processes</v-card-subtitle>
    </template>
    <v-list>
      <v-list-subheader>Workers</v-list-subheader>
      <v-list-item v-for="worker in clusterWorkers">
        <v-progress-linear :color="color" :model-value="worker.forks.length"
          :max="Math.max(...clusterWorkers.map(t => t.forks.length))" height="20" rounded>
          <template v-slot:default>
            {{ worker.name }}: {{ worker.forks.length }}
          </template>
        </v-progress-linear>
      </v-list-item>

      <v-list-subheader>Devices</v-list-subheader>
      <v-list-item v-for="worker in deviceWorkers">
        <v-progress-linear :color="color" :model-value="worker.count"
          :max="Math.max(...deviceWorkers.map(t => t.count))" height="20" rounded>
          <template v-slot:default>
            {{ worker.name }}: {{ worker.count }}
          </template>
        </v-progress-linear>
      </v-list-item>
    </v-list>
  </v-card>
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectedClient, connectPluginClient } from '@/common/client';
import { isDark } from '@/common/colors';
import { getFaPrefix } from '@/util/device-icons';
import { computed, ref } from 'vue';
import { chipColor } from '../interfaces/settings-common';
import { PluginModel } from './plugin-common';

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

const refreshClusters = ref(0);
const clusterWorkers = asyncComputed({
  async get() {
    const { clusterManager } = connectedClient.value || await connectPluginClient();
    const ret = await clusterManager.getClusterWorkers();
    return Object.entries(ret).map(([name, info]) => ({
      name,
      ...info,
    }));
  },
  default(previousValue) {
    return previousValue;
  },
  watch: {
    connectedClient: () => connectedClient.value,
    refreshclusters: () => refreshClusters.value,
  }
});

const deviceWorkers = computed(() => {
  const { systemManager } = connectedClient.value;
  if (!systemManager)
    return [];

  const ret = new Map<string, {
    id: string,
    name: string,
    count: number,
  }>();

  function addDevice(id: string) {
    let d = ret.get(id);
    if (!d) {
      d = {
        id,
        name: systemManager.getDeviceById(id)?.name || 'Unknown Device',
        count: 0,
      };
      ret.set(id, d);
    }
    d.count++;
  }

  for (const worker of clusterWorkers.value) {
    for (const fork of worker.forks) {
      addDevice(fork.id);
    }
  }

  return [...ret.values()];
})

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
