<template>
  <v-app v-if="!isLoggedIn" style="background-color: #6200EA;">
    <Login title="Management Console"></Login>
  </v-app>
  <v-app v-else-if="cloudLoginRedirect" style="background-color: #6200EA;">
    <CloudLogin></CloudLogin>
  </v-app>
  <v-app v-else-if="route.name === 'Launcher'">
    <Launcher></Launcher>
  </v-app>
  <v-app v-else>
    <AppBar v-model="drawer"></AppBar>
    <Drawer v-model="drawer"></Drawer>
    <v-main>
      <router-view v-slot="{ Component }" style="width: 100%; height: 100%;">
        <component :is="Component" />
      </router-view>
      <v-snackbar color="warning" :model-value="!connectedClient" :timeout="-1" close-on-content-click>
        <div style="display: flex; justify-content: center;">
          <div class="mr-4">
            <v-icon size="small">{{ getFaPrefix('fa-wifi-slash') }}</v-icon>
          </div>
          <div style="margin-top: 2px;" class="mr-6">Disconnected</div>
        </div>
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import  * as packageJson from '../package.json';
import { ref } from 'vue';
import { clientAppVersion, cloudLoginRedirect, connectedClient, connectPluginClient, isLoggedIn, setAppDomain, setClientAppVersion, setClientConnectionPreferences, setClientPluginId } from './common/client';
import CloudLogin from './common/components/CloudLogin.vue';
import Login from './common/components/Login.vue';
import { isTouchDevice } from './common/size';
import { getThemeManager } from "./common/theme";
import AppBar from './components/AppBar.vue';
import Drawer from './components/Drawer.vue';
import { useRoute } from 'vue-router';
import Launcher from './components/Launcher.vue';
import { getFaPrefix } from './device-icons';

const route = useRoute();

const drawer = ref(!isTouchDevice.value);
getThemeManager().updateTheme();

setClientAppVersion(packageJson.version);
console.log('management ui version', clientAppVersion);
setClientPluginId('@scrypted/core');
setAppDomain('manage.scrypted.app');
setClientConnectionPreferences({
  webrtc: false,
});
connectPluginClient();

//
</script>
<style>
html {
  font-size: 14px !important;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}
</style>
