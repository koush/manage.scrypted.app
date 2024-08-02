<template>
  <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center" :style="{
    background: deepPurple.accent4,
  }">
    <div>
      <v-card :width="320" theme="light" class="rounded-lg">
        <template v-slot:title>
          <v-card-title style="text-align: center;" class="scrypted-title">Scrypted</v-card-title>
        </template>
        <template v-slot:subtitle v-if="connectedClient?.serverVersion">
          <v-card-subtitle style="text-align: center;" class="scrypted-subtitle">{{ connectedClient?.serverVersion
            }}</v-card-subtitle>
          <v-card-subtitle style="text-align: center;" class="scrypted-subtitle2">{{
            connectedClient?.loginResult.hostname
          }}</v-card-subtitle>
        </template>
        <v-list style="text-align: center;">
          <v-list-item class="pr-16" v-for="item in launcherItems.computed.value"
            :prepend-icon="item.icon ? getFaPrefix(item.icon) : undefined" :to="item.to" :href="item.href">
            <v-list-item-title>{{ item.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item class="pr-16" v-if="launcherItems.loading.value">
            <template v-slot:prepend>
              <v-progress-circular size="small" color="info" indeterminate></v-progress-circular>
            </template>
            <v-list-item-title>Loading...</v-list-item-title>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <ToolbarTooltipButton force-icon raw-icon tooltip="Discord" href="https://discord.gg/DcFzmBHYGq"
            icon="fab fa-discord" target="_blank">
          </ToolbarTooltipButton>
          <ToolbarTooltipButton force-icon raw-icon tooltip="Reddit" icon="fab fa-reddit"
            href="https://www.reddit.com/r/Scrypted" target="_blank">
          </ToolbarTooltipButton>
          <ToolbarTooltipButton force-icon tooltip="Documentation" icon="fa-book" href="https://docs.scrypted.app"
            target="_blank">
          </ToolbarTooltipButton>
          <v-spacer>
          </v-spacer>
          <ToolbarTooltipButton @click="logoutClient" tooltip="Sign Out" icon="fa-arrow-right-from-bracket">
          </ToolbarTooltipButton>
        </v-card-actions>
      </v-card>

      <v-card v-if="showNvr" :width="320" theme="dark" class="rounded-lg mt-4">
        <template v-slot:title>
          <v-card-title style="text-align: center;" class="scrypted-title">Supercharge Scrypted</v-card-title>
        </template>
        <template v-slot:subtitle v-if="connectedClient?.serverVersion">
          <v-card-subtitle style="text-align: center;" class="scrypted-subtitle">Get Scrypted NVR</v-card-subtitle>
        </template>

        <v-list density="compact">
          <v-list-item href="https://demo.scrypted.app/#demo" target="_blank">
            <template v-slot:prepend>
              <v-icon small>{{ getFaPrefix('fa-timeline') }}</v-icon>
            </template>
            <v-list-item-subtitle>
              24/7 recording with smart detections.
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item lines="two" href="https://docs.scrypted.app/scrypted-nvr/features.html#rich-notifications" target="_blank">
            <template v-slot:prepend>
              <v-icon small>{{ getFaPrefix('fa-video-camera') }}</v-icon>
            </template>
            <v-list-item-subtitle>
              Rich Notifications with a concise thumbnail of the event.
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item lines="two" href="https://docs.scrypted.app/scrypted-nvr/features.html#adaptive-bitrate" target="_blank">
            <template v-slot:prepend>
              <v-icon small>{{ getFaPrefix('fa-bolt-lightning') }}</v-icon>
            </template>
            <v-list-item-subtitle>
              Adaptive bitrate streaming for HomeKit, Google Home, and Alexa.
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item lines="two" href="https://docs.scrypted.app/scrypted-nvr/apps.html" target="_blank">
            <template v-slot:prepend>
              <v-icon small>{{ getFaPrefix('fa-cloud') }}</v-icon>
            </template>
            <v-list-item-subtitle>
              Beautiful iOS, Android, and web app for local and remote viewing.
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item lines="two" href="https://ha-demo.scrypted.app" target="_blank">
            <template v-slot:prepend>
              <v-icon small>{{ getFaPrefix('fa-table-layout') }}</v-icon>
            </template>
            <v-list-item-subtitle>
              Home Assistant cards with snappy streams and two way audio.
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <div style="width: 100%; display: flex; justify-content: center;" class="mb-2">
          <v-btn size="small" style="justify-self: center;" href="https://demo.scrypted.app/#/demo" target="_blank">View Demo
          </v-btn>
          <v-btn size="small" style="justify-self: center;" to="/component/plugin/install?search=@scrypted/nvr">Install
          </v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>
<script setup lang="ts">
import { asyncComputedRaw } from '@/common/async-computed';
import { connectPluginClient, connectedClient, getBaseUrl, isScryptedCloudHostname, logoutClient } from '@/common/client';
import { getAllDevices } from '@/common/devices';
import { getFaPrefix } from '@/device-icons';
import { combineBaseUrl } from '@scrypted/client/src/index';
import { LauncherApplication, ScryptedInterface } from '@scrypted/types';
import { deepPurple } from 'vuetify/lib/util/colors.mjs';
import ToolbarTooltipButton from './ToolbarTooltipButton.vue';
import { computed } from 'vue';

const showNvr = computed(() => {
  if (!connectedClient.value)
    return false;
  return !connectedClient.value.systemManager.getDeviceById('@scrypted/nvr');
});

const launcherItems = asyncComputedRaw({
  async get() {
    const { systemManager } = connectedClient.value || await connectPluginClient();
    const ret = getAllDevices<LauncherApplication>(systemManager)
      .filter(d => d.interfaces.includes(ScryptedInterface.LauncherApplication))
      .map(d => {
        let href = isScryptedCloudHostname() ? d.applicationInfo?.cloudHref || d.applicationInfo?.href : d.applicationInfo?.href;
        if (!href) {
          const appId = d.interfaces.includes(ScryptedInterface.ScryptedPlugin) ? d.pluginId : d.id;
          href = combineBaseUrl(getBaseUrl(), `endpoint/${appId}/public/`);
        }

        const i = {
          ...d.applicationInfo!,
          name: d.applicationInfo?.name || d.name,
          href,
          to: href ? undefined : `/device/${d.id}`,
        };
        return i;
      });

    ret.unshift({
      name: 'Management Console',
      icon: 'fa-microchip',
      href: undefined,
      to: `/device`,
    })
    return ret;
  },
  default: [
    {
      name: 'Management Console',
      icon: 'fa-microchip',
      href: undefined,
      to: `/device`,
    }
  ],
})

</script>
