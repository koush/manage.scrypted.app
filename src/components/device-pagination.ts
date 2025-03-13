import { connectedClient, connectPluginClient } from "@/common/client";
import { hasFixedPhysicalLocation } from "@/device-icons";
import { ScryptedDeviceType } from "@scrypted/types";
import { computed } from "vue";

export const other = 'Other' as ScryptedDeviceType;

export interface TypedDevice {
    type?: ScryptedDeviceType | string;
}

export function createDeviceGroups(getDevices: () => TypedDevice[]) {
    const deviceGroups = computed(() => {
        if (!connectedClient.value) {
            connectPluginClient();
            return [];
        }

        let hasOther = false;
        const groups = new Set<ScryptedDeviceType | string>();
        for (const device of getDevices()) {
            if (hasFixedPhysicalLocation(device.type!))
                groups.add(device.type!);
            else
                hasOther = true;
        }

        const ret = [...groups];
        ret.sort((a, b) => {
            if (hasFixedPhysicalLocation(a) && !hasFixedPhysicalLocation(b))
                return -1;
            if (!hasFixedPhysicalLocation(a) && hasFixedPhysicalLocation(b))
                return 1;
            return a.localeCompare(b);
        });
        if (hasOther)
            ret.push(other);

        if (ret.length === 1)
            return [];
        return ret;
    });
    return deviceGroups;
}