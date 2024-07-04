<template>
    <v-dialog :model-value="true" persistent max-width="300px">
        <v-form @submit.prevent>
            <v-card class="rounded-lg pb-8">
                <v-card-title style="text-align: center;" class="pt-8 scrypted-title">Scrypted
                </v-card-title>

                <v-card-subtitle style="text-align: center;" class="pb-4 scrypted-subtitle">{{ title
                    }}</v-card-subtitle>

                <v-card-subtitle @click="windowLocationReload" style="text-align: center;"
                    class="pb-4 scrypted-subtitle2">{{ packageJson.version }}</v-card-subtitle>

                <template v-if="waitingCloudLogin">
                    <v-text-field class="pl-8 pr-8 pb-2 pt-8 mb-4" density="comfortable" variant="outlined"
                        v-model="oobCode" autocorrect="off" autocapitalize="off" spellcheck="false"
                        label="Cloud Sign In Code"
                        hint="An external browser has been opened to Sign In with Scrypted. Enter the code provided by the Sign In."
                        persistent-hint placeholder="ABCDEFGH"></v-text-field>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn size="small" @click="waitingCloudLogin = false">Cancel</v-btn>
                        <v-btn size="small" @click="completeOOBLogin" :disabled="!oobCode">Next</v-btn>
                    </v-card-actions>
                </template>
                <template v-else-if="!selfHosted">
                    <v-card-text style="text-align: center; font-size: .75rem;">Connect to a Scrypted server with a
                        Cloud Sign In.</v-card-text>

                    <v-btn variant="outlined" class="ml-8 mr-8 mb-4 pa-2" @click="doOOBLogin">Sign In with Cloud</v-btn>

                    <v-card-text style="text-align: center; font-size: .75rem;">Connect to a Scrypted server using self
                        hosted configuration.</v-card-text>
                    <v-btn variant="outlined" class="ml-8 mr-8 pa-2" @click="selfHosted = true">Connect Self
                        Hosted</v-btn>
                </template>
                <template v-else>
                    <v-text-field v-if="selfHosted" class="pl-8 pr-8 pb-2 pt-8 mb-4" density="comfortable"
                        variant="outlined" v-model="host" autocorrect="off" autocapitalize="off" spellcheck="false"
                        label="Host"
                        hint="Host and port of a self hosted installation. E.g. scrypted.example.com or 192.168.2.100:10443"
                        persistent-hint placeholder="scrypted.example.com"></v-text-field>

                    <div class="pl-8 pr-8 pb-2" style="color: red;" v-if="loginResult">{{ loginResult }}</div>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn size="small" @click="selfHosted = false">Cancel</v-btn>
                        <v-btn size="small" color="success" @click="doLogin">Connect</v-btn>
                    </v-card-actions>
                </template>
            </v-card>
        </v-form>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SCRYPTED_SERVER, cloudLoginRedirect, saveSelfHostedDomain } from '../client';
import * as packageJson from '../../../package.json';
import { windowLocationReload } from '../platform-shims';

defineProps<{
    title?: string;
}>();

const host = ref<string>();
const loginResult = ref<string>();
const selfHosted = ref(false);
const waitingCloudLogin = ref(false);
const oobCode = ref<string>('');

function doOOBLogin() {
    waitingCloudLogin.value = true;
    const loginUrl = new URL(`https://${SCRYPTED_SERVER}/_punch/login`);
    loginUrl.searchParams.set('client_id', 'scrypted-app');
    loginUrl.searchParams.set('response_type', 'code');
    const redirectUri = new URL('/_punch/oob', window.location.href);
    redirectUri.searchParams.set('link', window.location.href);
    loginUrl.searchParams.set('redirect_uri', redirectUri.toString());
    window.location.href = loginUrl.toString();
}

async function doLogin() {
    try {
        const url = `https://${host.value}/login`;
        const response = await fetch(url);
        const json = await response.json();
        saveSelfHostedDomain(host.value!);
        cloudLoginRedirect.value = undefined;
        windowLocationReload();
        if (!json.hasLogin)
            throw new Error('Server invalid.');
    }
    catch (e) {
        loginResult.value = (e as any).toString();
    }
}

async function completeOOBLogin() {
    const response = await fetch(`https://${SCRYPTED_SERVER}/_punch/state?id=${oobCode.value}`);
    const json = await response.json();
    const search: string = json.search;
    // const u = new URL('/_punch/oob', window.location.href);
    const u = new URL(`https://${SCRYPTED_SERVER}/_punch/oob`);
    u.hash = '';
    u.search = search;
    console.warn(search, u.href);
    window.location.href = u.href;
}
</script>