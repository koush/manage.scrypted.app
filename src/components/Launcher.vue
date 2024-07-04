<template>
  <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center" :style="{
    background: deepPurple.accent4,
  }">
    <div>
      <v-card :width="320" theme="light" class="rounded-lg">
        <!-- <template v-slot:prepend>
          <v-icon>{{ getFaPrefix('fa-microchip') }} }}</v-icon>
        </template> -->
        <template v-slot:title>
          <v-card-title style="text-align: center;" class="scrypted-title">Scrypted</v-card-title>
        </template>
        <template v-slot:subtitle v-if="connectedClient?.version">
          <v-card-subtitle style="text-align: center;" class="scrypted-subtitle">{{ connectedClient?.version
            }}</v-card-subtitle>
          <v-card-subtitle style="text-align: center;" class="scrypted-subtitle2">{{ connectedClient?.loginResult.hostname
            }}</v-card-subtitle>
        </template>
        <v-list style="text-align: center;">
          <v-list-item class="pr-16" v-for="item in launcherItems"
            :prepend-icon="item.icon ? getFaPrefix(item.icon) : undefined" :to="item.to" :href="item.href">
            <v-list-item-title >{{ item.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
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
    </div>
  </div>
</template>
<script setup lang="ts">
import { asyncComputed } from '@/common/async-computed';
import { connectPluginClient, connectedClient, getBaseUrl, logoutClient } from '@/common/client';
import { getAllDevices } from '@/common/devices';
import { getFaPrefix } from '@/device-icons';
import { combineBaseUrl } from '@scrypted/client/src/index';
import { LauncherApplication, ScryptedInterface } from '@scrypted/types';
import { deepPurple } from 'vuetify/lib/util/colors.mjs';
import ToolbarTooltipButton from './ToolbarTooltipButton.vue';

const launcherItems = asyncComputed({
  async get() {
    const { systemManager } = connectedClient.value || await connectPluginClient();
    const ret = getAllDevices<LauncherApplication>(systemManager)
      .filter(d => d.interfaces.includes(ScryptedInterface.LauncherApplication))
      .map(d => {
        let href = d.applicationInfo?.href;
        if (!href && d.interfaces.includes(ScryptedInterface.HttpRequestHandler)) {
          const appId = d.interfaces.includes(ScryptedInterface.ScryptedPlugin) ? d.pluginId : d.id;
          href = combineBaseUrl(getBaseUrl(), `endpoint/${appId}/public/`);
        }

        const i = {
          ...d.applicationInfo!,
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
