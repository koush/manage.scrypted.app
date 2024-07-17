<template>
  <v-card>
    <template v-slot:prepend>
      <v-icon size="x-small">{{ getFaPrefix('fa-chart-simple') }}</v-icon>
    </template>
    <template v-slot:title>
      <v-card-subtitle class="mt-1">Plugin Stats</v-card-subtitle>
    </template>

    <v-table>
      <thead>
        <tr>
          <th>RPC Objects</th>
          <th>Pending Results</th>
          <th>Connections</th>
        </tr>
      </thead>
      <tbody style="font-size: .75rem">
        <tr v-for="(, i) in chartMax">
          <td><template v-if="topRpc[i]?.info?.rpcObjects"><span class="bold">{{ topRpc[i]?.info?.rpcObjects
                }}</span><span class="float-right">{{
                  topRpc[i]?.name
                }}</span></template><template v-else>N/A</template></td>
          <td><template v-if="topPending[i]?.info?.pendingResults"><span class="bold">{{
            topPending[i]?.info?.pendingResults }}</span><span class="float-right">{{
                  topPending[i]?.name }}</span></template><template v-else>N/A</template></td>
          <td><template v-if="topClients[i]?.info?.clientsCount"><span class="bold">{{
            topClients[i]?.info?.clientsCount }}</span><span class="float-right">{{
                  topClients[i]?.name }}</span></template><template v-else>N/A</template></td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>
<script setup lang="ts">
import { getFaPrefix } from '@/device-icons';
import { computed } from 'vue';
import { PluginModel } from './plugin-common';


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

const chartMax = computed(() => {
  const r = Math.max(topRpc.value.length, topPending.value.length, topClients.value.length);
  return r;
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
