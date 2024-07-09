import { EventListener, EventListenerOptions, EventListenerRegister, ScryptedDevice } from "@scrypted/types";
import { ComputedRef, WritableComputedRef, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { connectPluginClient, connectedClient } from "./common/client";
import { asyncComputed } from "./common/async-computed";

export function getIdFromRoute() {
  const route = useRoute();
  const id = computed(() => route.params.id as string);
  return id;
}

export function getDeviceFromRoute<T>() {
  const id = getIdFromRoute();
  const device = getDeviceFromId<T>(() => id.value);
  return {
    id,
    device,
  };
}

export function getDeviceFromId<T>(id: () => string) {
  const device = asyncComputed({
    async get() {
      const { systemManager } = connectedClient.value || await connectPluginClient();
      const d = systemManager.getDeviceById<T>(id());
      return d;
    },
    watch: {
      id: () => id(),
    },
    default(previousValue) {
      return connectedClient.value?.systemManager.getDeviceById<T>(id()) || previousValue;
    }
  });

  return device;
}

export function registerListener(device: ComputedRef<ScryptedDevice> | WritableComputedRef<ScryptedDevice>, options: EventListenerOptions, callback: EventListener) {
  let register: EventListenerRegister;
  function registerListener() {
    register?.removeListener();
    register = device.value?.listen(options, callback);
  }
  registerListener();
}

export function goDevice(router: ReturnType<typeof useRouter>, device: ScryptedDevice) {
  goDeviceId(router, device.id);
}

export function goDeviceId(router: ReturnType<typeof useRouter>, id: string) {
  router.push(`/device/${id}`);
}
