import { EventListener, EventListenerOptions, EventListenerRegister, ScryptedDevice } from "@scrypted/types";
import { ComputedRef, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { connectPluginClient, connectedClient } from "./common/client";

export function getDeviceFromRoute<T>() {
  const route = useRoute();

  const id = computed(() => route.params.id as string);

  const device = computed(() => {
    if (!connectedClient.value) {
      connectPluginClient();
      return;
    }

    const d = connectedClient.value.systemManager.getDeviceById<T>(id.value);
    return d;
  });

  return {
    id,
    device,
  }
}

export function registerListener(device: ComputedRef<ScryptedDevice>, options: EventListenerOptions, callback: EventListener) {
  let register: EventListenerRegister;
  function registerListener() {
    register?.removeListener();
    register = device.value?.listen(options, callback);
  }
  registerListener();
}

export function goDevice(router: ReturnType<typeof useRouter>, device: ScryptedDevice) {
  router.push(`/device/${device.id}`);
}
