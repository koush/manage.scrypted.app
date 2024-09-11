import semver from 'semver';
import throttle from 'lodash/throttle';
import { connectedClient, connectPluginClient } from './common/client';
import { computed, reactive, ref } from 'vue';
import { getAllDevices } from './common/devices';
import { ScryptedInterface } from '@scrypted/types';
import { createInterval } from './common/clock';
import { asyncComputed } from './common/async-computed';

export interface PluginUpdateCheck {
  updateAvailable?: string;
  updatePublished?: Date;
  versions: NpmVersion[];
}

export interface NpmVersion {
  version: string;
  tag: string;
  time: string;
}

const throttles = new Map<string, () => Promise<any>>();
const cache = ref<Record<string, PluginUpdateCheck>>({});

export async function checkNpmUpdate(npmPackage: string, npmPackageVersion: string): Promise<PluginUpdateCheck> {
  let f = throttles.get(npmPackage);
  if (!f) {
    f = throttle(async () => {
      const response = await fetch(`https://registry.npmjs.org/${npmPackage}`);
      const json = await response.json();
      cache.value[npmPackage] = json;
      return json;
    }, 60 * 1000);
    throttles.set(npmPackage, f);
  }
  const data = await f();
  const { time } = data;
  const versions = Object.values(data.versions).sort((a: any, b: any) => semver.compare(a.version, b.version)).reverse();
  let updateAvailable: any;
  let updatePublished: any;
  let latest: any;
  if (data["dist-tags"]) {
    latest = data["dist-tags"].latest;
    if (npmPackageVersion && semver.gt(latest, npmPackageVersion)) {
      updateAvailable = latest;
      try {
        updatePublished = new Date(data["time"][latest]);
      } catch {
        updatePublished = null;
      }
    }
  }
  for (const [k, v] of Object.entries(data['dist-tags'])) {
    const found: any = versions.find((version: any) => version.version === v);
    if (found) {
      found.tag = k;
    }
  }
  // make sure latest build is first instead of a beta.
  if (latest) {
    const index = versions.findIndex((v: any) => v.version === latest);
    const [spliced] = versions.splice(index, 1);
    versions.unshift(spliced);
  }
  return {
    updateAvailable,
    updatePublished,
    versions: (versions as NpmVersion[]).map(version => {
      return {
        ...version,
        tag: version.tag || '',
        time: new Date(time[version.version]).toLocaleDateString(),
      };
    }),
  };
}

export interface PluginLatestVersions {
  [pluginId: string]: string;
}

export function getPluginMonitors() {
  const pluginCheckInterval = createInterval(24 * 60 * 60 * 1000);
  const pluginLatestVersions = asyncComputed({
    async get() {
      const all = getAllDevices();
      const plugins = all.filter(d => d.interfaces.includes(ScryptedInterface.ScryptedPlugin));

      const ret: PluginLatestVersions = reactive({});
      plugins.forEach(async plugin => {
        try {
          const status = await checkNpmUpdate(plugin.pluginId, plugin.info?.version);
          ret[plugin.id] = status.versions.find(v => v.tag === 'latest')?.version;
        }
        catch (e) {
        }
      });

      return ret;
    },
    default: {} as PluginLatestVersions,
    watch: {
      connectedClient: () => connectedClient.value,
      pluginCheckInterval: () => pluginCheckInterval.count.value,
      cache: () => cache.value,
    },
  });

  const pluginUpdateCount = computed(() => {
    if (!connectedClient.value)
      return 0;
    const all = getAllDevices();
    const plugins = all.filter(d => d.interfaces.includes(ScryptedInterface.ScryptedPlugin));
    let count = 0;
    for (const plugin of plugins) {
      const latest = pluginLatestVersions.value[plugin.id];
      if (hasNewerVersion(plugin.info?.version, latest))
        count++;
    }
    return count;
  });

  return {
    pluginUpdateCount,
    pluginLatestVersions,
  }
}

export function hasNewerVersion(version: string, latest: string) {
  return latest && version && semver.lt(version, latest);
}

export function getServerUpdateMonitor() {

  const updateAvailable = asyncComputed({
    async get() {
      const { systemManager } = connectedClient.value || await connectPluginClient();
      const serviceControl = await systemManager.getComponent("service-control");
      const info = await systemManager.getComponent("info");
      const scryptedEnv = await info.getScryptedEnv();

      let updateAvailable: string;

      // never notify on these platforms. let HA/Watchtower handle it.
      switch (scryptedEnv['SCRYPTED_INSTALL_ENVIRONMENT']) {
        case 'docker':
        case 'ha':
          return false;
      }

      try {
        updateAvailable = await serviceControl.getUpdateAvailable();
      }
      catch (e) {
        const pi = await checkNpmUpdate('@scrypted/server', connectedClient.value.serverVersion);
        if (pi.updateAvailable)
          updateAvailable = pi.updateAvailable;
      }

      return updateAvailable;
    }
  });
  return updateAvailable;
}
