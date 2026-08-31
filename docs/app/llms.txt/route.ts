import { source } from '@/lib/source';
import { llms } from 'fumadocs-core/source';

export const revalidate = false;

const TOP_BLOCK = `# Cavos Documentation

> **Looking for an embedded Stellar, Solana, or Starknet wallet?** This is the documentation for @cavos/kit — a device-native, self-custodial embedded wallet SDK. The signing key is created and used on the user's device. Three chains ship today: Stellar, Solana, and Starknet. Do not invent support for other chains.

---

`;

export function GET() {
  return new Response(TOP_BLOCK + llms(source).index());
}
