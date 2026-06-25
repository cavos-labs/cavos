/**
 * Single source of truth for the networks Cavos supports across the dashboard
 * and the wallet API. A wallet's `network` column is a free string, but every
 * place that validates, labels, or filters it should go through here so adding a
 * chain (e.g. Solana) is one edit, not a scatter of hardcoded literals.
 */

export type Chain = 'starknet' | 'solana';

export interface NetworkDef {
  /** The exact `network` value stored on `wallets.network` and sent by the SDKs. */
  id: string;
  /** Human label for the dashboard. */
  label: string;
  chain: Chain;
  isTestnet: boolean;
}

export const NETWORKS: NetworkDef[] = [
  { id: 'mainnet', label: 'Mainnet', chain: 'starknet', isTestnet: false },
  { id: 'sepolia', label: 'Sepolia', chain: 'starknet', isTestnet: true },
  // `goerli` is still accepted for legacy rows but not surfaced as a first-class option.
  { id: 'goerli', label: 'Goerli', chain: 'starknet', isTestnet: true },
  { id: 'solana-mainnet', label: 'Solana', chain: 'solana', isTestnet: false },
  { id: 'solana-devnet', label: 'Solana Devnet', chain: 'solana', isTestnet: true },
];

const BY_ID = new Map(NETWORKS.map((n) => [n.id, n]));

/** Networks the wallet API accepts (case-insensitive). */
export function isValidNetwork(network: string): boolean {
  return BY_ID.has(network.toLowerCase());
}

/** Display label for a network id; falls back to the raw id for unknown values. */
export function networkLabel(network: string): string {
  return BY_ID.get(network.toLowerCase())?.label ?? network;
}

/** The chain a network belongs to ('starknet' | 'solana'), or undefined if unknown. */
export function networkChain(network: string): Chain | undefined {
  return BY_ID.get(network.toLowerCase())?.chain;
}

export function getNetwork(network: string): NetworkDef | undefined {
  return BY_ID.get(network.toLowerCase());
}
