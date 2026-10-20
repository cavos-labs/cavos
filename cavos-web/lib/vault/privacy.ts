// Mirrors StarknetPrivacyConfig in @cavos/kit (chains/starknet/privacy). The
// vault only ever reads it from here, so an app's own code cannot change it.

export type PrivacyNetwork = 'sepolia' | 'mainnet'

export interface NetworkPrivacySettings {
  enabled: boolean
  sponsor: boolean
  prover: string
  discovery: string
  ohttp?: boolean
  rpcUrl?: string
}

export type VaultPrivacy = Partial<Record<PrivacyNetwork, NetworkPrivacySettings>>

export type PrivacyFeeMode =
  | { mode: 'sponsored'; pool_fee: { paid_by: 'user'; token: string } }
  | { mode: 'sponsored'; pool_fee: { paid_by: 'sponsor' } }
  | { mode: 'default'; gas_token: string }

export interface VaultPrivacyConfig {
  pool: string
  prover: string
  discovery: string
  ohttp?: boolean
  rpcUrl?: string
  relay: {
    url: string
    fee: PrivacyFeeMode
    maxFee: string
    allowedFeeRecipients: string[]
  }
}

export const PRIVACY_NETWORKS: PrivacyNetwork[] = ['sepolia', 'mainnet']

export const NETWORK_NAME: Record<PrivacyNetwork, string> = { sepolia: 'Sepolia', mainnet: 'Mainnet' }

const STRK = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d'
const MAX_FEE = '10000000000000000000'

const CAVOS: Record<PrivacyNetwork, { pool: string; relay: string; forwarder: string }> = {
  sepolia: {
    pool: '0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91',
    relay: 'https://sepolia-paymaster.cavos.xyz',
    forwarder: '0x6182be93b71889c874f53c51d1fe15025e30d6ed7118f15bf766c36eca38b3d',
  },
  mainnet: {
    pool: '0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a',
    relay: 'https://paymaster.cavos.xyz',
    forwarder: '0x733128df4f5cb1b70ccde2aa000ada016f22675479b8fcdb243c6c4d3a4232f',
  },
}

export function emptyNetworkPrivacy(): NetworkPrivacySettings {
  return { enabled: false, sponsor: false, prover: '', discovery: '', ohttp: true, rpcUrl: '' }
}

const NETWORK_KEYS = ['enabled', 'sponsor', 'prover', 'discovery', 'ohttp', 'rpcUrl']

function serviceUrl(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required`)
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error(`${label} is not a valid URL`)
  }
  const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]'
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) {
    throw new Error(`${label} must use https (http is only accepted for localhost)`)
  }
  if (url.username || url.password) throw new Error(`${label} must not contain credentials`)
  return url.toString().replace(/\/+$/, '')
}

/** Throws a message fit to show the developer. */
export function parseVaultPrivacy(input: unknown): VaultPrivacy {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('vault_privacy must be an object')
  const record = input as Record<string, unknown>
  for (const key of Object.keys(record)) {
    if (!PRIVACY_NETWORKS.includes(key as PrivacyNetwork)) throw new Error(`${key} is not a network; use sepolia or mainnet`)
  }
  const parsed: VaultPrivacy = {}
  for (const network of PRIVACY_NETWORKS) {
    const raw = record[network]
    if (raw === undefined) continue
    const name = NETWORK_NAME[network]
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`${name}: settings must be an object`)
    const settings = raw as Record<string, unknown>
    for (const key of Object.keys(settings)) {
      if (!NETWORK_KEYS.includes(key)) throw new Error(`${name}: ${key} is not a known setting`)
    }
    if (typeof settings.enabled !== 'boolean') throw new Error(`${name}: enabled must be true or false`)
    if (typeof settings.sponsor !== 'boolean') throw new Error(`${name}: sponsor must be true or false`)
    if (settings.ohttp !== undefined && typeof settings.ohttp !== 'boolean') {
      throw new Error(`${name}: ohttp must be true or false`)
    }
    const blank = (value: unknown) => value === undefined || value === null || (typeof value === 'string' && !value.trim())
    if (!settings.enabled && blank(settings.prover) && blank(settings.discovery) && blank(settings.rpcUrl)) {
      parsed[network] = {
        enabled: false,
        sponsor: settings.sponsor,
        prover: '',
        discovery: '',
        ...(settings.ohttp !== undefined ? { ohttp: settings.ohttp } : {}),
      }
      continue
    }
    const entry: NetworkPrivacySettings = {
      enabled: settings.enabled,
      sponsor: settings.sponsor,
      prover: serviceUrl(settings.prover, `${name}: prover URL`),
      discovery: serviceUrl(settings.discovery, `${name}: discovery URL`),
    }
    if (settings.ohttp !== undefined) entry.ohttp = settings.ohttp
    if (!blank(settings.rpcUrl)) entry.rpcUrl = serviceUrl(settings.rpcUrl, `${name}: RPC URL`)
    parsed[network] = entry
  }
  return parsed
}

/** Only enabled networks appear; the result is what the vault hands to its privacy parser. */
export function toVaultPrivacyConfig(settings: VaultPrivacy): Partial<Record<PrivacyNetwork, VaultPrivacyConfig>> {
  const configs: Partial<Record<PrivacyNetwork, VaultPrivacyConfig>> = {}
  for (const network of PRIVACY_NETWORKS) {
    const entry = settings[network]
    if (!entry?.enabled) continue
    const cavos = CAVOS[network]
    configs[network] = {
      pool: cavos.pool,
      prover: entry.prover,
      discovery: entry.discovery,
      ...(entry.ohttp !== undefined ? { ohttp: entry.ohttp } : {}),
      ...(entry.rpcUrl ? { rpcUrl: entry.rpcUrl } : {}),
      relay: {
        url: cavos.relay,
        fee: entry.sponsor
          ? { mode: 'sponsored', pool_fee: { paid_by: 'sponsor' } }
          : { mode: 'default', gas_token: STRK },
        maxFee: MAX_FEE,
        allowedFeeRecipients: [cavos.forwarder],
      },
    }
  }
  return configs
}

/** Null when the stored value is missing or no longer validates. */
export function readStoredPrivacy(stored: unknown): VaultPrivacy | null {
  if (!stored) return null
  try {
    return parseVaultPrivacy(stored)
  } catch {
    return null
  }
}

export function sponsorsPrivacy(stored: unknown, network: PrivacyNetwork): boolean {
  const entry = readStoredPrivacy(stored)?.[network]
  return Boolean(entry?.enabled && entry.sponsor)
}
