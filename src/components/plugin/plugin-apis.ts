import { connectPluginClient, connectedClient } from '@/common/client';

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
