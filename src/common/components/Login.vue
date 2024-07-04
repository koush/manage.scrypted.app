<template>
    <v-dialog :model-value="true" persistent max-width="300px">
        <v-form @submit.prevent="doLogin">
            <v-card class="rounded-lg">
                <v-card-title style="text-align: center;" class="pt-8 scrypted-title">Scrypted
                </v-card-title>
                <v-card-subtitle style="text-align: center;" class="pb-4 scrypted-subtitle">{{ title }}
                </v-card-subtitle>
                <v-card-subtitle v-if="loginHostname"
                    style="text-align: center;"
                    class="scrypted-subtitle2">Log into: {{ loginHostname }}</v-card-subtitle>

                <v-text-field class="pl-8 pr-8 pb-2 pt-8" density="comfortable" variant="outlined" v-model="username"
                    autocorrect="off" autocapitalize="off" spellcheck="false" label="User Name"></v-text-field>
                <v-text-field class="pl-8 pr-8 pb-2" density="comfortable" variant="outlined" v-model="password"
                    type="password" label="Password" autocomplete="on">
                </v-text-field>

                <div class="pl-8 pr-8 pb-2" style="color: red;" v-if="loginResult">{{ loginResult }}</div>

                <v-card-actions>
                    <v-btn :icon="getFaPrefix('fa-home')" v-if="isScryptedCloudHostname()" size="small"
                        @click.prevent="logoutClient"></v-btn>
                    <v-spacer></v-spacer>
                    <v-btn type="submit" variant="text" @click.prevent="doLogin">Log In</v-btn>
                </v-card-actions>
            </v-card>
        </v-form>
    </v-dialog>
</template>

<script setup lang="ts">
import { loginScryptedClient, checkScryptedClientLogin } from '@scrypted/client/src/index';
import { ref } from 'vue';
import { getBaseUrl, isScryptedCloudHostname, isSelfHosted, logoutClient, saveSelfHostedCredentials } from '../client';
import { windowLocationReload } from '../platform-shims';
import { getFaPrefix } from '../fa-prefix';

defineProps<{
    title?: string;
}>();

const username = ref<string>();
const password = ref<string>();
const loginResult = ref<string>();
const loginHostname = ref<string>();

const baseUrl = getBaseUrl();
checkScryptedClientLogin({
    baseUrl,
})
    .then(r => {
        loginHostname.value = r.hostname;
    })

async function doLogin() {
    const baseUrl = getBaseUrl();

    loginResult.value = "";
    try {
        const response = await loginScryptedClient({
            baseUrl,
            username: username.value!,
            password: password.value!,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        if (response.error) {
            loginResult.value = response.error;
            return;
        }
        try {
            const redirect_uri = new URL(window.location.href).searchParams.get('redirect_uri');
            if (redirect_uri) {
                window.location.href = redirect_uri;
                return;
            }

        }
        catch (e) {
        }

        if (isSelfHosted()) {
            saveSelfHostedCredentials(username.value!, password.value!);
        }

        windowLocationReload();
    }
    catch (e) {
        const error = (e as any).toString();
        loginResult.value = error;
        // cert may need to be reaccepted? Server is down? Go to the
        // server root to force the network error to bypass the PWA cache.
        if (
            error.includes("Network Error") &&
            window.location.href.startsWith("https:")
        ) {
            window.location.href = "/";
        }
    }
}
</script>
<style>
.scrypted-title {
    font-weight: 500 !important;
    font-size: 1.5rem !important;
    font-family: Quicksand, sans-serif !important;
    text-transform: uppercase;
}

.scrypted-subtitle {
    font-weight: 500 !important;
    font-size: 1.0rem !important;
    font-family: Quicksand, sans-serif !important;
    text-transform: uppercase;
}

.scrypted-subtitle2 {
    font-weight: 500 !important;
    font-size: .75rem !important;
    font-family: Quicksand, sans-serif !important;
    text-transform: uppercase;
}
</style>
