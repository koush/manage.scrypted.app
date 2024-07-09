import { SystemManager } from "@scrypted/types";
import { connectedClient } from "./client";

export function getAllDevices<T>(systemManager?: SystemManager) {
    const ret = getAllDeviceIds(systemManager)
        .map(id => systemManager!.getDeviceById<T>(id));
    return ret;
}

export function getAllDeviceIds(systemManager?: SystemManager) {
  systemManager ||= connectedClient.value?.systemManager;
  if (!systemManager)
      return [];

  const ret = Object.keys(systemManager.getSystemState())
  return ret;
}
