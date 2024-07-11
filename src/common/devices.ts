import { SystemManager } from "@scrypted/types";
import { connectedClient } from "./client";
import { computed } from "vue";

export const cachedSystemManager = computed<SystemManager|undefined>(previousValue => {
  return connectedClient.value?.systemManager || previousValue;
});

export function getAllDevices<T>(systemManager?: SystemManager) {
  systemManager ||= connectedClient.value?.systemManager || cachedSystemManager.value;
  const ret = getAllDeviceIds(systemManager)
    .map(id => systemManager!.getDeviceById<T>(id));
  return ret;
}

export function getAllDeviceIds(systemManager?: SystemManager) {
  systemManager ||= connectedClient.value?.systemManager || cachedSystemManager.value;
  if (!systemManager)
    return [];

  const ret = Object.keys(systemManager.getSystemState())
  return ret;
}
