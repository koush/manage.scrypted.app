import { ScryptedDeviceType } from "@scrypted/types";
import { getFaPrefix } from "./common/fa-prefix";
export { getFaPrefix } from "./common/fa-prefix";

export function typeToIcon(type?: ScryptedDeviceType | string) {
  return `${getFaPrefix(typeToIconInternal(type))}`;
}

function typeToIconInternal(type?: ScryptedDeviceType | string) {
  console.log(ScryptedDeviceType.Internet)
  switch (type) {
    case ScryptedDeviceType.Camera: return "fa-video";
    case ScryptedDeviceType.Doorbell: return "fa-bell";
    case ScryptedDeviceType.Fan: return "fa-fan";
    case ScryptedDeviceType.Light: return "fa-lightbulb";
    case ScryptedDeviceType.Switch: return "fa-toggle-on";
    case ScryptedDeviceType.Outlet: return "fa-plug";
    case ScryptedDeviceType.Sensor: return "fa-exclamation-triangle";
    case ScryptedDeviceType.Scene: return "fa-sun";
    case ScryptedDeviceType.Program: return "fa-code";
    case ScryptedDeviceType.Automation: return "fa-bolt";
    case ScryptedDeviceType.Event: return "fa-exclamation";
    case ScryptedDeviceType.Vacuum: return "fa-trash";
    case ScryptedDeviceType.Notifier: return "fa-bell";
    case ScryptedDeviceType.Lock: return "fa-unlock-alt";
    case ScryptedDeviceType.Thermostat: return "fa-thermometer-three-quarters";
    case ScryptedDeviceType.PasswordControl: return "fa-key";
    case ScryptedDeviceType.Display: return "fa-tv";
    case ScryptedDeviceType.Speaker: return "fa-volume-up";
    case ScryptedDeviceType.Entry: return "fa-warehouse";
    case ScryptedDeviceType.Garage: return "fa-warehouse";
    case ScryptedDeviceType.API: return "fa-cloud";
    case ScryptedDeviceType.DataSource: return "fa-chart-area";
    case ScryptedDeviceType.DeviceProvider: return "fa-server";
    case ScryptedDeviceType.Unknown: return "fa-question-circle";
    case ScryptedDeviceType.Valve: return "fa-faucet";
    case ScryptedDeviceType.Irrigation: return "fa-faucet";
    case ScryptedDeviceType.Person: return "fa-user";
    case ScryptedDeviceType.SecuritySystem: return "fa-shield-alt";
    case ScryptedDeviceType.Builtin: return "fa-server";
    case ScryptedDeviceType.Siren: return "fa-siren";
    case ScryptedDeviceType.Internet: return "fa-globe";
    case ScryptedDeviceType.Bridge: return "fa-chart-network";
    case ScryptedDeviceType.Network: return "fa-network-wired";
  }

  return "fa-toggle-on";
}

export function hasFixedPhysicalLocation(type: ScryptedDeviceType | string): boolean {
  if (!type)
    return false;
  switch (type) {
    case ScryptedDeviceType.Builtin:
    case ScryptedDeviceType.Internal:
    case ScryptedDeviceType.Program:
    case ScryptedDeviceType.Automation:
    case ScryptedDeviceType.API:
    case ScryptedDeviceType.Scene:
    case ScryptedDeviceType.Event:
    case ScryptedDeviceType.DeviceProvider:
    case ScryptedDeviceType.DataSource:
    case ScryptedDeviceType.Notifier:
    case ScryptedDeviceType.Person:
    case ScryptedDeviceType.Unknown:
      return false;
  }
  return true;
}
