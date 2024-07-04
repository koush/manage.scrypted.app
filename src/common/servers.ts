import { computed, ref } from "vue";
import { SCRYPTED_SERVER, isScryptedCloudHostname, isSelfHosted } from "./client";
import type { ScryptedClientLoginResult } from "@scrypted/client/src/index";

export interface ServerRegistration {
    name: string;
}

export const serverRegistrations = ref<Record<string, ServerRegistration>>();
const _serverId = ref<string>();

export const serverId = computed(() => {
    return _serverId.value || localStorage.getItem('previousServerId');
})

export const currentServer = computed(() => {
    return serverRegistrations.value?.[serverId.value!]?.name;
});

export async function refreshServerRegistrations() {
    if (!isScryptedCloudHostname() || isSelfHosted())
        return;
    try {
        _serverId.value = undefined;
        const response = await fetch(`https://${SCRYPTED_SERVER}/_punch/userinfo`, {
            credentials: 'include',
        });
        const json = await response.json();
        // todo: need a better way to handle this that doesnt use knowledge of internals.
        // maybe that ought to be in the @scrypted/client.
        serverRegistrations.value = json.registrations;
        if (serverId.value && !serverRegistrations.value![serverId.value])
            clearPreviousLoginResults();

        if (json.serverUserId && json.serverUserId !== json.id)
            _serverId.value = `${json.serverUserId}#${json.serverId}`;
        else
            _serverId.value = json.serverId;
        // localStorage.setItem('previousServerId', _serverId.value!);
    }
    catch (e) {
    }
}

export async function changeServer(serverId: string) {
    const url = new URL(`https://${SCRYPTED_SERVER}/_punch/server_change`);
    url.searchParams.set('server_id', serverId);
    await fetch(url.toString(), {
        credentials: 'include',
    });
    localStorage.setItem('previousServerId', serverId);
    window.location.hash = '';
    window.location.reload();
}

export const showServerDropown = computed(() => {
    if (!isScryptedCloudHostname() || isSelfHosted())
        return false;
    const regs = serverRegistrations.value || {};
    return Object.keys(regs).length > 1 || (Object.keys(regs).length && !regs[serverId.value!]);
});

export async function saveLoginResult(loginResult: ScryptedClientLoginResult) {
    if (!isScryptedCloudHostname() || isSelfHosted())
        return;
    await refreshServerRegistrations();
    const previousLoginResults = getPreviousLoginResults();
    previousLoginResults[serverId.value!] = loginResult;
    localStorage.setItem('previousLoginResults', JSON.stringify(previousLoginResults));
}

export function getPreviousLoginResults(): Record<string, ScryptedClientLoginResult> {
    try {
        return JSON.parse(localStorage.getItem('previousLoginResults')!) || {};
    }
    catch (e) {
    }
    return {};
}

export function getPreviousLoginResult(): ScryptedClientLoginResult | undefined {
    if (!isScryptedCloudHostname() || isSelfHosted())
        return;
    const results = getPreviousLoginResults() || {};
    let id = serverId.value!;
    if (!id)
        id = Object.keys(results)[0];
    return results[id];
}

export function clearPreviousLoginResults() {
    localStorage.removeItem('previousServerId');
    localStorage.removeItem('previousLoginResult');
    localStorage.removeItem('previousLoginResults');
}
