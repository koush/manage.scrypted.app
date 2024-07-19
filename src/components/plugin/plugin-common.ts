import { ScryptedDeviceType } from "@scrypted/types";
import { PluginInfo } from "../../internal-apis";

export interface PluginModel {
  id: string;
  name: string;
  package: string;
  version: string;
  type: ScryptedDeviceType;
  updateAvailable: boolean;
  info: PluginInfo;
}
