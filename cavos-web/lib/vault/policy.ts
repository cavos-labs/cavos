// Mirrors VaultPolicy in @cavos/kit/vault. The vault only ever reads it from
// here, so an app's own code cannot loosen it.

export type OverLimit = 'ask' | 'block' | 'sign'
export type VaultChain = 'solana' | 'stellar' | 'starknet'

export interface VaultLimit {
  chain: VaultChain
  asset: string
  perTx: string
  perDay: string
}

export interface VaultPolicy {
  overLimit: OverLimit
  limits: VaultLimit[]
}

export const DEFAULT_VAULT_POLICY: VaultPolicy = {
  overLimit: 'ask',
  limits: [
    { chain: 'solana', asset: 'SOL', perTx: '0.1', perDay: '0.5' },
    { chain: 'solana', asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', perTx: '25', perDay: '100' },
    { chain: 'solana', asset: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', perTx: '25', perDay: '100' },
    { chain: 'stellar', asset: 'XLM', perTx: '100', perDay: '500' },
    { chain: 'stellar', asset: 'USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', perTx: '25', perDay: '100' },
    { chain: 'stellar', asset: 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', perTx: '25', perDay: '100' },
    { chain: 'starknet', asset: 'ETH', perTx: '0.01', perDay: '0.05' },
    { chain: 'starknet', asset: 'STRK', perTx: '20', perDay: '100' },
    { chain: 'starknet', asset: 'USDC', perTx: '25', perDay: '100' },
  ],
}

const MAX_LIMITS = 50
const AMOUNT = /^\d{1,15}(\.\d{1,9})?$/
const SOLANA_MINT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const STELLAR_ASSET = /^[A-Za-z0-9]{1,12}:G[A-Z2-7]{55}$/
// The vault knows these tokens' contracts and decimals on Starknet.
export const STARKNET_ASSETS = ['ETH', 'STRK', 'USDC']

export function isValidAsset(chain: VaultChain, asset: string): boolean {
  if (chain === 'solana') return asset === 'SOL' || SOLANA_MINT.test(asset)
  if (chain === 'starknet') return STARKNET_ASSETS.includes(asset)
  return asset === 'XLM' || STELLAR_ASSET.test(asset)
}

export const ASSET_HINT: Record<VaultChain, string> = {
  solana: 'SOL or a mint address',
  stellar: 'XLM or a CODE:ISSUER asset',
  starknet: 'ETH, STRK or USDC',
}

/** Throws a message fit to show the developer. */
export function parseVaultPolicy(input: unknown): VaultPolicy {
  if (!input || typeof input !== 'object') throw new Error('vault_policy must be an object')
  const { overLimit, limits } = input as Record<string, unknown>
  if (overLimit !== 'ask' && overLimit !== 'block' && overLimit !== 'sign') {
    throw new Error('overLimit must be "ask", "block" or "sign"')
  }
  if (!Array.isArray(limits) || limits.length > MAX_LIMITS) {
    throw new Error(`limits must be a list of at most ${MAX_LIMITS} entries`)
  }
  const seen = new Set<string>()
  const parsed = limits.map((raw, index): VaultLimit => {
    const { chain, asset, perTx, perDay } = (raw ?? {}) as Record<string, unknown>
    const where = `Limit ${index + 1}`
    if (chain !== 'solana' && chain !== 'stellar' && chain !== 'starknet') {
      throw new Error(`${where}: chain must be solana, stellar or starknet`)
    }
    if (typeof asset !== 'string' || !isValidAsset(chain, asset.trim())) {
      throw new Error(`${where}: "${String(asset)}" is not ${ASSET_HINT[chain]}`)
    }
    if (typeof perTx !== 'string' || !AMOUNT.test(perTx)) throw new Error(`${where}: per-transaction amount is not a number`)
    if (typeof perDay !== 'string' || !AMOUNT.test(perDay)) throw new Error(`${where}: daily amount is not a number`)
    if (Number(perDay) < Number(perTx)) throw new Error(`${where}: the daily limit is below the per-transaction limit`)
    const key = asset.trim()
    if (seen.has(key)) throw new Error(`${where}: ${key} is listed twice`)
    seen.add(key)
    return { chain, asset: key, perTx, perDay }
  })
  return { overLimit, limits: parsed }
}
