import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { connectPluginClient, connectedClient } from "./common/client";
import { ScryptedDevice } from "@scrypted/types";

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

export function goDevice(router: ReturnType<typeof useRouter>, device: ScryptedDevice) {
  router.push(`/device/${device.id}`)
}
