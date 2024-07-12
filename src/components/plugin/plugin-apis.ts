import { asyncComputed } from '@/common/async-computed';
import { connectPluginClient, connectedClient } from '@/common/client';
import { EventListenerRegister } from '@scrypted/types';
import { computed, ref } from 'vue';

export async function installPlugin(pkg: string, version?: string) {
  const { systemManager } = connectedClient.value || await connectPluginClient();
  const plugins = await systemManager.getComponent('plugins');
  await plugins.installNpm(pkg, version);
}

export async function restartPlugin(pkg: string) {
  const { systemManager } = connectedClient.value || await connectPluginClient();
  const plugins = await systemManager.getComponent('plugins');
  await plugins.reload(pkg);
}

export async function clearConsole(id: string) {
  const plugins = await connectedClient.value!.systemManager.getComponent(
    "plugins"
  );
  plugins.clearConsole(id);
}

export interface PluginInfo {
  clientsCount: number;
  pid: number;
  rpcObjects: number;
  pendingResults: number;
}

export async function getPluginInfo(pkg: string): Promise<PluginInfo> {
  const plugins = await connectedClient.value!.systemManager.getComponent(
    "plugins"
  );
  const ret = await plugins.getPluginInfo(pkg);
  return ret;
}

export interface ScryptedAlert {
  _id: string;
  timestamp: number;
  title: string;
  path: string;
  message: string;
}

export async function getAlerts(): Promise<ScryptedAlert[]> {
  const alerts = await connectedClient.value!.systemManager.getComponent('alerts')
  const ret = await alerts.getAlerts();
  console.warn(ret);
  return ret;
}

const alertListener = computed<EventListenerRegister>(ov => {
  ov?.removeListener();
  if (!connectedClient.value)
    return;
  return connectedClient.value.systemManager.listen((eventSource, eventDetails, eventData) => {
    if (eventDetails.eventInterface === "Logger") {
      alertRefresh.value++;
      return;
    }
  });
});

const alertRefresh = ref(0);
export const scryptedAlerts = asyncComputed({
  async get({ }, ov: ScryptedAlert[]) {
    if (!connectedClient.value)
      return ov;
    return await getAlerts();
  },
  default(previousValue) {
    return previousValue || [];
  },
  watch: {
    alertListener: () => alertListener.value,
    alertRefresh: () => alertRefresh.value,
  }
});
