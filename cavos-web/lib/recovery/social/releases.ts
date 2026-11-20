/**
 * Which enclave release holds which sealed record.
 *
 * Every enclave release seals under a root key only its own image can unwrap,
 * and nothing is migrated between releases. A record can therefore be opened
 * only by the release that sealed it, so each record and each session carries
 * that release's number, and a record sealed by an earlier release is sealed
 * again by the current one the next time its owner signs in.
 *
 * None of this is trusted. The browser verifies the attestation of whichever
 * enclave it is handed; a wrong number here sends a job to an enclave that
 * cannot open the record, and nothing more.
 */

export interface EnclaveReleases {
  /**
   * The release behind `CAVOS_RECOVERY_ENCLAVE_URL`. Null until
   * `CAVOS_RECOVERY_ENCLAVE_RELEASE` is set, and records written meanwhile
   * carry no release.
   */
  current: number | null
  /**
   * Where the release that sealed a record can be reached, or null when it is
   * not deployed. A record with no release is taken to the current enclave.
   */
  urlOf(release: number | null): string | null
}

/**
 * Reads the deployed releases from the environment:
 *
 * - `CAVOS_RECOVERY_ENCLAVE_URL`: the relay of the current release.
 * - `CAVOS_RECOVERY_ENCLAVE_RELEASE`: that release's number.
 * - `CAVOS_RECOVERY_RETIRED_ENCLAVE_URLS`: a JSON object from release number to
 *   relay URL, for earlier releases kept running to recover with.
 */
export function readEnclaveReleases(
  env: Readonly<Record<string, string | undefined>> = process.env,
): EnclaveReleases {
  const currentUrl = env.CAVOS_RECOVERY_ENCLAVE_URL
  if (!currentUrl) {
    throw new Error('CAVOS_RECOVERY_ENCLAVE_URL is required for social recovery')
  }
  const current = env.CAVOS_RECOVERY_ENCLAVE_RELEASE
    ? parseRelease(env.CAVOS_RECOVERY_ENCLAVE_RELEASE)
    : null
  const retired = parseRetired(env.CAVOS_RECOVERY_RETIRED_ENCLAVE_URLS)
  if (current !== null && retired.has(current)) {
    throw new Error(`enclave release ${current} is configured as both current and retired`)
  }

  return {
    current,
    urlOf(release) {
      if (release === null || release === current) return currentUrl
      return retired.get(release) ?? null
    },
  }
}

/** Relays of the retired releases. Their sign-in keys still verify the tokens a recovery uses. */
export function retiredEnclaveUrls(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string[] {
  return [...parseRetired(env.CAVOS_RECOVERY_RETIRED_ENCLAVE_URLS).values()]
}

/**
 * Whether the enclave itself signs this provider's tokens.
 *
 * It signs them with a key each release derives from its own root key, so
 * such a token verifies only on the release that issued it. A user whose
 * record was sealed by an earlier release has to sign in with that release
 * before it will recover them.
 */
export function issuedByEnclave(provider: string): boolean {
  return provider === 'email' || provider === 'github' || provider === 'telegram'
}

export function isRelease(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/**
 * The relay a sign-in runs on: the release the client asked for, or the
 * current one. Null when what it asked for is not a deployed release.
 */
export function signInUrl(releases: EnclaveReleases, requested: unknown): string | null {
  if (requested === undefined) return releases.urlOf(null)
  return isRelease(requested) ? releases.urlOf(requested) : null
}

export interface SealedEnrollment {
  enclave_release: number | null
  dek_sealed: boolean
}

/**
 * Whether an enrolment made with `release` replaces `existing`.
 *
 * Only a sealed DEK moves forward: the device still holds it and hands it to
 * the newer enclave, so the new record protects the same wallet. A record
 * that carries an on-chain recovery authority stays with the release that
 * generated it, because that authority cannot be changed.
 */
export function supersedes(
  release: number | null,
  existing: SealedEnrollment,
  sealsDek: boolean,
): boolean {
  return (
    sealsDek &&
    existing.dek_sealed &&
    release !== null &&
    existing.enclave_release !== null &&
    existing.enclave_release < release
  )
}

function parseRelease(value: string): number {
  if (!/^[1-9][0-9]*$/.test(value)) {
    throw new Error(`"${value}" is not an enclave release number`)
  }
  return Number(value)
}

function parseRetired(value: string | undefined): Map<number, string> {
  const retired = new Map<number, string>()
  if (!value) return retired
  const parsed: unknown = JSON.parse(value)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('CAVOS_RECOVERY_RETIRED_ENCLAVE_URLS must be a JSON object')
  }
  for (const [release, url] of Object.entries(parsed)) {
    if (typeof url !== 'string' || !URL.canParse(url)) {
      throw new Error(`enclave release ${release} has no valid URL`)
    }
    retired.set(parseRelease(release), url)
  }
  return retired
}
