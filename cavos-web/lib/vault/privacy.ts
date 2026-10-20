export type PrivacyNetwork = 'sepolia' | 'mainnet'

/** Per network. Prover, discovery and RPC are optional overrides of the StarkWare-hosted defaults. */
export interface NetworkPrivacySettings {
  enabled: boolean
  sponsor: boolean
  prover?: string
  discovery?: string
  ohttp?: boolean
  rpcUrl?: string
}

export type VaultPrivacy = Partial<Record<PrivacyNetwork, NetworkPrivacySettings>>

export type PrivacyFeeMode =
  | { mode: 'sponsored'; pool_fee: { paid_by: 'user'; token: string } }
  | { mode: 'sponsored'; pool_fee: { paid_by: 'sponsor' } }
  | { mode: 'default'; gas_token: string }

/** Mirrors StarknetPrivacyConfig in @cavos/kit. The vault reads it only from Cavos, so an app cannot change it. */
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

export const PRIVACY_DEFAULTS: Record<
  PrivacyNetwork,
  { pool: string; relay: string; forwarder: string; prover: string; discovery: string; rpcUrl?: string }
> = {
  sepolia: {
    pool: '0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91',
    relay: 'https://sepolia-paymaster.cavos.xyz',
    forwarder: '0x6182be93b71889c874f53c51d1fe15025e30d6ed7118f15bf766c36eca38b3d',
    prover: 'https://transaction-prover.alpha-sepolia.sw-dev.io',
    discovery: 'https://discovery-service.alpha-sepolia.sw-dev.io',
    rpcUrl: 'https://starknet-sepolia-rpc.publicnode.com',
  },
  mainnet: {
    pool: '0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a',
    relay: 'https://paymaster.cavos.xyz',
    forwarder: '0x733128df4f5cb1b70ccde2aa000ada016f22675479b8fcdb243c6c4d3a4232f',
    prover: 'https://transaction-prover.alpha-mainnet.sw-dev.io',
    discovery: 'https://discovery-service.alpha-mainnet.sw-dev.io',
  },
}

export function emptyNetworkPrivacy(): NetworkPrivacySettings {
  return { enabled: false, sponsor: false, ohttp: true }
}

const NETWORK_KEYS = ['enabled', 'sponsor', 'prover', 'discovery', 'ohttp', 'rpcUrl']

function optionalServiceUrl(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) return undefined
  if (typeof value !== 'string') throw new Error(`${label} must be a URL`)
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
    const prover = optionalServiceUrl(settings.prover, `${name}: prover URL`)
    const discovery = optionalServiceUrl(settings.discovery, `${name}: discovery URL`)
    const rpcUrl = optionalServiceUrl(settings.rpcUrl, `${name}: RPC URL`)
    parsed[network] = {
      enabled: settings.enabled,
      sponsor: settings.sponsor,
      ...(prover ? { prover } : {}),
      ...(discovery ? { discovery } : {}),
      ...(settings.ohttp !== undefined ? { ohttp: settings.ohttp } : {}),
      ...(rpcUrl ? { rpcUrl } : {}),
    }
  }
  return parsed
}

/** Only enabled networks appear; the result is what the vault hands to its privacy parser. */
export function toVaultPrivacyConfig(settings: VaultPrivacy): Partial<Record<PrivacyNetwork, VaultPrivacyConfig>> {
  const configs: Partial<Record<PrivacyNetwork, VaultPrivacyConfig>> = {}
  for (const network of PRIVACY_NETWORKS) {
    const entry = settings[network]
    if (!entry?.enabled) continue
    const defaults = PRIVACY_DEFAULTS[network]
    const rpcUrl = entry.rpcUrl ?? defaults.rpcUrl
    configs[network] = {
      pool: defaults.pool,
      prover: entry.prover ?? defaults.prover,
      discovery: entry.discovery ?? defaults.discovery,
      ...(entry.ohttp !== undefined ? { ohttp: entry.ohttp } : {}),
      ...(rpcUrl ? { rpcUrl } : {}),
      relay: {
        url: defaults.relay,
        fee: entry.sponsor
          ? { mode: 'sponsored', pool_fee: { paid_by: 'sponsor' } }
          : { mode: 'default', gas_token: STRK },
        maxFee: MAX_FEE,
        allowedFeeRecipients: [defaults.forwarder],
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
