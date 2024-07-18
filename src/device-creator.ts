import { DeviceCreator, DeviceCreatorSettings, DeviceDiscovery, ScryptedNativeId, Setting } from "@scrypted/types";
import { useRouter } from "vue-router";
import { connectedClient } from "./common/client";
import { goDeviceId } from "./id-device";

export async function createDevice(router: ReturnType<typeof useRouter>, id: string, settings: Setting[]) {
  const device = connectedClient.value.systemManager.getDeviceById<DeviceCreator>(id);
  const deviceCreatorSettings: DeviceCreatorSettings = {};
  for (const setting of settings) {
    deviceCreatorSettings[setting.key] = setting.value;
  }
  const newId = await device.createDevice(deviceCreatorSettings);
  goDeviceId(router, newId);
}

export async function adoptDevice(router: ReturnType<typeof useRouter>, id: string, nativeId: ScryptedNativeId, settings: Setting[]) {
  const device = connectedClient.value.systemManager.getDeviceById<DeviceDiscovery>(id);
  const deviceCreatorSettings: DeviceCreatorSettings = {};
  for (const setting of settings) {
    deviceCreatorSettings[setting.key] = setting.value;
  }
  const newId = await device.adoptDevice({
    nativeId,
    settings: deviceCreatorSettings,
  });
  goDeviceId(router, newId);
}
