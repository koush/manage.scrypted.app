import { connectScryptedClient, getCurrentBaseUrl, logoutScryptedClient, redirectScryptedLogin, ScryptedClientLoginError, ScryptedClientOptions, ScryptedClientStatic } from '@scrypted/client/src/index';
import { timeoutFunction, timeoutPromise } from '@scrypted/common/src/promise-utils';
import { sleep } from "@scrypted/common/src/sleep";
import { computed, reactive, ref, shallowRef } from 'vue';
import { clearPreviousLoginResults, getPreviousLoginResult, refreshServerRegistrations, saveLoginResult } from '../common/servers';
import { supportsOOBLogin } from './browser';
import { setLossyAsyncInterval } from './clock';
import { isFullScreen } from './displaymode';
import { windowLocationReload } from './platform-shims';

export let connectedClient = shallowRef<ScryptedClientStatic>();
export let clientPromise: Promise<ScryptedClientStatic> | undefined;
// assume logged in unless login response explicitly fails.
export const isLoggedIn = ref(true);
export const cloudLoginRedirect = ref<string>();

export const SCRYPTED_SERVER = window.location.hostname === 'beta.scrypted.app' ? 'home-dev.scrypted.app' : 'home.scrypted.app';

export function isConnected() {
    return !!connectedClient.value;
}

export const isConnectedReactive = computed(() => !!connectedClient.value);

let probe: Promise<void> | undefined;
async function probeConnection() {
    try {
        console.log('waiting for client (30s)');
        const client = await timeoutFunction(30000, async () => {
            if (connectedClient.value)
                return connectedClient.value;
            if (clientPromise)
                return clientPromise;
            return undefined;
        });

        checkContinuousHeartbeat();
        const probeTimeeout = heartbeatMissed ? 1 : 5;

        console.log(`probing (${probeTimeeout}s), heartbeat skipped (${heartbeatMissed})`);
        await timeoutFunction(probeTimeeout * 1000, async (isTimedOut) => {
            if (!client)
                throw new Error('Client currently disconnected.');

            if (isTimedOut())
                return;
            const clientPlugin = client.systemManager.getDeviceByName(clientPluginId);
            await clientPlugin.probe();
        });
        console.log('Scrypted connection probe succeeded.');
        heartbeatMissed = false;
        return;
    }
    catch (e) {
        console.error('Scrypted connection probe failed. Reconnecting.', e);
        connectedClient.value = undefined;
        clientPromise?.then(client => client.disconnect());
        clientPromise = undefined;
    }

    heartbeatMissed = false;
    connectPluginClient();
}

function tryProbe() {
    if (probe)
        return;
    probe = probeConnection();
    probe.finally(() => probe = undefined);
}

function logVisibility() {
    console.log('visibilitychange', {
        focus: document.hasFocus(),
        visibility: document.visibilityState,
    });
}

let heartbeat = Date.now();
let heartbeatMissed = false;
function checkContinuousHeartbeat() {
    heartbeatMissed = heartbeatMissed || Date.now() - heartbeat > 10000;
    return heartbeatMissed;
}

setLossyAsyncInterval(1000, () => {
    checkContinuousHeartbeat();
    heartbeat = Date.now();
});

// triggered when switching to a new tab or window becomes minimized or app goes in background
document.addEventListener('visibilitychange', e => {
    logVisibility();
    if (document.visibilityState === 'visible')
        tryProbe();
});

let appDomain: string;
export function isAppDomain(url: URL | Location = window.location) {
    return url.hostname === appDomain || url.hostname === 'beta.scrypted.app';
}

export function setAppDomain(domain: string) {
  appDomain = domain;
}

export function isHomeScryptedApp(url: URL | Location = window.location) {
    return url.hostname === SCRYPTED_SERVER;
}

export function fixupAppDomainLinkUrl(url: string) {
    if (isAppDomain())
        return new URL(url, getBaseUrl()).toString();

    if (!url.startsWith('/')) {
        const u = new URL(url);
        url = u.pathname + u.search + u.hash;
    }

    url = new URL('.' + url, getDemoSafeCurrentBaseUrl()).toString();
    return url;
}

export function getDemoSafeCurrentBaseUrl() {
    const bu = getCurrentBaseUrl();
    if (bu)
        return bu;
    const u = new URL(document.baseURI);
    return u.toString();
}

export function fixupAppDomainImageUrl(url: string) {
    if (!url?.startsWith('/')) {
        console.warn('not rewriting full url. If thumbnails aren\'t loading, report this to @koush on discord', url);
        return url;
    }

    // console.error('rewriting', url);
    // direct connection can be rewritten to the direct connection host without any fuss.
    if (connectedClient.value?.loginResult.queryToken && connectedClient.value?.address && (connectedClient.value?.connectionType === 'http-direct' || isSelfHosted())) {
        // get the absolute url and change the host and protocol.
        const rewrite = new URL(url, window.location.href);
        const base = new URL(connectedClient.value.address);
        rewrite.protocol = base.protocol;
        rewrite.hostname = base.hostname;
        rewrite.port = base.port;
        for (const [k, v] of Object.entries(connectedClient.value.loginResult.queryToken)) {
            rewrite.searchParams.set(k, v);
        }
        url = rewrite.toString();
        // console.error('rewrote to', url);
        return url;
    }

    // app domain can also be rewritten without checking.
    if (isAppDomain()) {
        url = new URL(url, getBaseUrl()).toString();
        // console.error('rewrote to', url);
        return url;
    }

    // will be protocol://host:port/[rehosted-under-subdirectory/]endpoint/@scrypted/core/public
    const scryptedRootURI = new URL(getDemoSafeCurrentBaseUrl());

    // dead code path maybe, since full urls are short circuited.
    if (!url.startsWith('/')) {
        const parsed = new URL(url);
        url = parsed.pathname + parsed.search;
    }

    const imageUrl = new URL('.' + url, scryptedRootURI);
    url = imageUrl.toString();
    // console.error('rewrote to', url);
    return url;
}

export function isScryptedCloudHostname() {
    return isAppDomain() || isHomeScryptedApp();
}

export function getBaseHostname() {
    return localStorage.getItem('selfHostedDomain') || SCRYPTED_SERVER;
}

export function getBaseUrl() {
    const baseUrl = isAppDomain() ? `https://${getBaseHostname()}` : getDemoSafeCurrentBaseUrl();
    return baseUrl;
}

let firstConnectionAttempt: number;
export async function connectClient(options: ScryptedClientOptions): Promise<ScryptedClientStatic> {
    if (connectedClient.value)
        return connectedClient.value!;
    if (clientPromise)
        return clientPromise;

    refreshServerRegistrations();

    console.log('connection options', options);
    clientPromise = (async () => {
        // reload the app after an hour if it is in a disconnected state.
        if (firstConnectionAttempt !== undefined) {
            if (!isFullScreen.value && Date.now() - firstConnectionAttempt > 1 * 60 * 60 * 1000) {
                await sleep(1000);
                windowLocationReload();
            }
        }
        else {
            firstConnectionAttempt = Date.now();
        }

        options.previousLoginResult = getPreviousLoginResult();
        Object.assign(options, getSelfHostedCredentials());

        const client = await connectScryptedClient(options);
        saveLoginResult(client.loginResult).catch(() => { });
        return client;
    })();

    try {
        const self = connectedClient.value = await clientPromise;
        // this is a hack that utilizes knowledge of how the internal state is set to achieve reactivity.
        (self.systemManager as any).state = reactive((self.systemManager as any).state);
        isLoggedIn.value = true;

        self.onClose = () => {
            console.error('Scrypted client closed');
            if (self === connectedClient.value) {
                connectedClient.value = undefined;
                clientPromise = undefined;
            }
        }
    }
    catch (e) {
        if (e instanceof ScryptedClientLoginError) {
            if (e.result.redirect) {
                if (supportsOOBLogin) {
                    cloudLoginRedirect.value = e.result.redirect;
                }
                else {
                    const baseUrl = getBaseUrl();
                    redirectScryptedLogin({
                        baseUrl,
                        redirect: e.result.redirect,
                    });
                }
                // rethrow without setting isLoggedIn to allow redirection without flashing
                // the local login ui
                throw e;
            }
            isLoggedIn.value = false;
        }
        console.error('connection error', e);
        clientPromise = undefined;
        throw e;
    }
    finally {
    }
    return clientPromise;
}

// seems flaky and slow
export function isScryptedClientWebrtcEnabled() {
    return localStorage.getItem('scryptedClientWebrtcEnabled') === 'true';
}

export function isScryptedClientDirectConnectEnabled() {
    return localStorage.getItem('scryptedClientDirectConnectEnabled') !== 'false';
}

export const forceDefaultConnectionMode = true;
export function isScryptedClientConnectionModeDefault() {
    return forceDefaultConnectionMode || localStorage.getItem('scryptedClientConnectionModeDefault') !== 'false';
}

export let hasPendingConnectionChanges = false;
export function setScryptedClientWebrtcEnabled(value: boolean) {
    hasPendingConnectionChanges = true;
    return localStorage.setItem('scryptedClientWebrtcEnabled', value.toString());
}

export function setScryptedClientDirectConnectEnabled(value: boolean) {
    hasPendingConnectionChanges = true;
    return localStorage.setItem('scryptedClientDirectConnectEnabled', value.toString());
}

export function setScryptedClientConnectionModeDefault(value: boolean) {
    hasPendingConnectionChanges = true;
    if (value) {
        localStorage.removeItem('scryptedClientWebrtcEnabled');
        localStorage.removeItem('scryptedClientDirectConnectEnabled');
    }
    return localStorage.setItem('scryptedClientConnectionModeDefault', value.toString());
}


async function connectClientWithPreferences(pluginId: string) {
    const baseUrl = getBaseUrl();

    let webrtc: boolean | undefined;
    let direct: boolean | undefined;
    let local: boolean | undefined;

    if (!isScryptedClientConnectionModeDefault()) {
        // webrtc will be used if enabled and on scrypted cloud. no need to use webrtc
        // in self hosted situation as it is already peer to peer, and loopback when on LAN.
        webrtc = isScryptedClientWebrtcEnabled();
        // direct connect will be used if enabled and on scrypted cloud. no need to use direct
        // in self hosted situation as it is already peer to peer, and loopback when on LAN.
        direct = isScryptedClientDirectConnectEnabled();
        local = isScryptedClientDirectConnectEnabled();
    }

    return await connectClient({
        local,
        direct,
        baseUrl,
        webrtc,
        pluginId,
    });
}

let clientPluginId: string;
export function setClientPluginId(pluginId: string) {
    clientPluginId = pluginId;
}

export async function connectPluginClient() {
    return connectClientWithPreferences(clientPluginId);
}

export function isSelfHosted() {
    return !!localStorage.getItem('selfHostedDomain');
}

export function saveSelfHostedCredentials(username: string, password: string) {
    localStorage.setItem('selfHostedUsername', username);
    localStorage.setItem('selfHostedPassword', password);
}

export function saveSelfHostedDomain(host?: string) {
    if (host)
        localStorage.setItem('selfHostedDomain', host);
    else
        localStorage.removeItem('selfHostedDomain');
}

export function getSelfHostedCredentials() {
    return {
        username: localStorage.getItem('selfHostedUsername'),
        password: localStorage.getItem('selfHostedPassword'),
    }
}

export async function logoutClient() {
    localStorage.removeItem('selfHostedUsername');
    localStorage.removeItem('selfHostedPassword');
    localStorage.removeItem('selfHostedDomain');
    clearPreviousLoginResults();
    const baseUrl = getBaseUrl();

    await timeoutPromise(2000, logoutScryptedClient(baseUrl)).catch(() => { });
    windowLocationReload();
}
