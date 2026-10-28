export const ENCLAVE_RELEASES_REPO = 'cavos-labs/cavos-recovery';

const PCR0_PATTERN = /^[0-9a-f]{96}$/;

export interface ReleaseAsset {
  name: string;
  url: string;
}

export interface ReleaseSummary {
  assets?: ReleaseAsset[];
}

/** True for a PCR0 as the release workflow writes it: 96 lowercase hex characters. */
export function isValidPcr0(value: string): boolean {
  return PCR0_PATTERN.test(value);
}

/** The exact asset name the release workflow gives the Sigstore bundle of a PCR0. */
export function bundleAssetName(pcr0: string): string {
  return `enclave-${pcr0}.sigstore.json`;
}

/** Finds the API url of the bundle asset for a PCR0 across a list of releases, or null. */
export function findBundleAssetUrl(releases: ReleaseSummary[], pcr0: string): string | null {
  const name = bundleAssetName(pcr0);
  for (const release of releases) {
    for (const asset of release.assets ?? []) {
      if (asset.name === name && typeof asset.url === 'string') return asset.url;
    }
  }
  return null;
}
