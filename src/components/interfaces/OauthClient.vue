<template>
  <v-dialog v-model="loginDialog" max-width="300px">
    <v-card>
      <v-card-title>Login Required</v-card-title>
      <v-card-text>Scrypted Management Console is currently inside a browser iframe. For web security, a new tab will be
        opened, and the
        browser may prompt to log into this server again.
        <br />
        <br />
        <b>Home Assistant Addon installations must create a new Administrator user</b> within the Scrypted Users sidebar
        menu to log in from outside of Home Assistant.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn icon @click="loginDialog = false">Cancel</v-btn>
        <v-btn icon @click="onClickContinue">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-btn size="x-small" color="info" @click="login">
    <template v-slot:prepend>
      <v-icon>{{ getFaPrefix('fa-arrow-left-to-bracket') }}</v-icon>
    </template>
    Login
  </v-btn>
</template>
<script setup lang="ts">
import { connectedClient } from '@/common/client';
import { getFaPrefix } from '@/device-icons';
import { getDeviceFromId } from '@/id-device';
import { OauthClient } from '@scrypted/types';
import { ref } from 'vue';

const props = defineProps<{
  id: string;
}>();

const device = getDeviceFromId<OauthClient>(() => props.id);

const loginDialog = ref(false);

function isIFrame() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

async function login() {
  if (isIFrame()) {
    loginDialog.value = true;
    return;
  }

  const data = await device.value.getOauthUrl();
  var url = new URL(data);
  let redirect_uri = url.searchParams.get('redirect_uri');
  if (redirect_uri) {
    let u;
    try {
      u = new URL(redirect_uri);
    }
    catch (e) {
      const baseURI = new URL(document.baseURI);
      const scryptedRootURI = new URL('../../../../', baseURI);
      u = new URL('.' + redirect_uri, scryptedRootURI);
      u.hostname = 'localhost';
    }
    if (u.hostname === 'localhost') {
      u.hostname = new URL(window.location.href).hostname;
      redirect_uri = u.toString();
    }
  }
  else {
    redirect_uri = `https://home.scrypted.app/web/oauth/callback`;
  }
  url.searchParams.set('redirect_uri', redirect_uri);
  url.searchParams.set('state',JSON.stringify({
    d: props.id,
    s: url.searchParams.get('state'),
    r: window.location.toString(),
  }));

  window.location.href = url.toString();
}

async function onClickContinue() {
  const { endpointManager } = connectedClient.value;
  const ep = await endpointManager.getPublicLocalEndpoint();
  const u = new URL(ep);
  u.hash = window.location.hash;
  u.pathname = '/endpoint/@scrypted/core/public/';
  window.open(u.toString(), '_blank');
}
</script>
