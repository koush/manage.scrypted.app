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
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { cloudLoginRedirect, connectPluginClient, isLoggedIn, setAppDomain, setClientPluginId } from './common/client';
import CloudLogin from './common/components/CloudLogin.vue';
import Login from './common/components/Login.vue';
import { isTouchDevice } from './common/size';
import { getThemeManager } from "./common/theme";
import AppBar from './components/AppBar.vue';
import Drawer from './components/Drawer.vue';
import { useRoute } from 'vue-router';
import Launcher from './components/Launcher.vue';

const route = useRoute();

const drawer = ref(!isTouchDevice.value);
getThemeManager().updateTheme();

setClientPluginId('@scrypted/core');
setAppDomain('manage.scrypted.app');
connectPluginClient();

//
</script>
<style>
html {
  font-size: 14px !important;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}

</style>
