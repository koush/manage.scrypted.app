import type { ScryptedClientLoginResult } from "@scrypted/client/src/index";
import { computed, ref } from "vue";
import { SCRYPTED_SERVER, appDomainBypassCloudLogin, isAppDomain, isSelfHosted } from "./client";

export interface ServerRegistration {
    name: string;
}

export const serverRegistrations = ref<Record<string, ServerRegistration>>();
const _serverId = ref<string>();

export const serverId = computed(() => {
    return _serverId.value || localStorage.getItem('previousServerId');
});

export function getBareServerId(serverId: string|null|undefined) {
    return serverId?.split('#').pop();
}

export const bareServerId = computed(() => {
    return getBareServerId(serverId.value);
});

export const currentServer = computed(() => {
    return serverRegistrations.value?.[serverId.value!]?.name;
});

export async function refreshServerRegistrations() {
    if (!isAppDomain() || isSelfHosted()) {
        console.log('not refreshing server registrations');
        return;
    }
    console.log('refreshing server registrations');
    try {
        _serverId.value = undefined;
        const response = await fetch(`https://${SCRYPTED_SERVER}/_punch/userinfo`, {
            credentials: 'include',
        });
        const json = await response.json();
        console.log('server registrations', json);
        // todo: need a better way to handle this that doesnt use knowledge of internals.
        // maybe that ought to be in the @scrypted/client.
        serverRegistrations.value = json.registrations;
        if (serverId.value && !serverRegistrations.value![serverId.value])
            clearPreviousLoginResults();

        if (json.serverUserId && json.serverUserId !== json.id)
            _serverId.value = `${json.serverUserId}#${json.serverId}`;
        else
            _serverId.value = json.serverId;
        setPreviousServerId(_serverId.value!);
    }
    catch (e) {
        console.warn('Server registration refresh failed.', e);
    }
}

export async function changeServer(serverId: string, reload = true, validate = false) {
    if (validate) {
        await refreshServerRegistrations();
        const found = Object.keys(serverRegistrations.value!).find(id => getBareServerId(id) === serverId);
        if (!found)
            return;
        serverId = found;
    }
    const url = new URL(`https://${SCRYPTED_SERVER}/_punch/server_change`);
    url.searchParams.set('server_id', serverId);
    await fetch(url.toString(), {
        credentials: 'include',
    });
    await refreshServerRegistrations();
    if (reload) {
        window.location.hash = '';
        window.location.reload();
    }
}

export function setPreviousServerId(serverId: string) {
    localStorage.setItem('previousServerId', serverId);
}

export const showServerDropown = computed(() => {
    if (!isAppDomain() || isSelfHosted())
        return false;
    const regs = serverRegistrations.value || {};
    return Object.keys(regs).length > 1 || (Object.keys(regs).length && !regs[serverId.value!]);
});

export async function saveLoginResult(loginResult: ScryptedClientLoginResult) {
    if (!isAppDomain() || isSelfHosted() || !appDomainBypassCloudLogin)
        return;
    await refreshServerRegistrations();
    const previousLoginResults = getPreviousLoginResults();
    if (!loginResult.serverId)
        return;
    // login results are saved with the server id that does not contain a user id.
    previousLoginResults[loginResult.serverId] = loginResult;
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
    if (!isAppDomain() || isSelfHosted() || !appDomainBypassCloudLogin)
        return;
    const results = getPreviousLoginResults() || {};
    // login results are saved with the server id that does not contain a user id.
    let id = bareServerId.value!;
    if (!id)
        id = Object.keys(results)[0];
    return results[id];
}

export function clearPreviousLoginResults() {
    localStorage.removeItem('previousServerId');
    localStorage.removeItem('previousLoginResult');
    localStorage.removeItem('previousLoginResults');
}
