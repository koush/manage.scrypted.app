import semver from 'semver';

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

export async function checkNpmUpdate(npmPackage: string, npmPackageVersion: string): Promise<PluginUpdateCheck> {
  const response = await fetch(`https://registry.npmjs.org/${npmPackage}`);
  const data = await response.json();
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
