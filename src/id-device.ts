import { EventListener, EventListenerOptions, EventListenerRegister, ScryptedDevice } from "@scrypted/types";
import { ComputedRef, WritableComputedRef, computed, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { asyncComputed } from "./common/async-computed";
import { connectPluginClient, connectedClient } from "./common/client";

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
  watch(() => device.value, registerListener);
  registerListener();
  onUnmounted(() => register?.removeListener());
  return register;
}

export function registerListeners(ids: () => string[], options: EventListenerOptions, callback: EventListener) {
  let registers: EventListenerRegister[];
  function registerListeners() {
    registers?.forEach(register => register.removeListener());
    registers = ids().map(id => connectedClient.value?.systemManager.getDeviceById(id)?.listen(options, callback));
  }
  watch(ids, registerListeners);
  registerListeners();
  onUnmounted(() => registers?.forEach(register => register.removeListener));
  return registers;
}

export function goDevice(router: ReturnType<typeof useRouter>, device: ScryptedDevice) {
  goDeviceId(router, device.id);
}

export function goDeviceId(router: ReturnType<typeof useRouter>, id: string) {
  router.push(`/device/${id}`);
}
