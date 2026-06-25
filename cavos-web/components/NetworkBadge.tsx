import { networkLabel, networkChain } from '@/lib/constants/networks';

/**
 * Network pill used across the dashboard. Labels via the shared network
 * registry and tints Solana distinctly from Starknet so multi-chain wallets are
 * scannable at a glance. Mainnet (any chain) gets the solid ink treatment.
 */
export function NetworkBadge({ network }: { network: string }) {
  const chain = networkChain(network);
  const label = networkLabel(network);
  const isMainnet = network === 'mainnet' || network === 'solana-mainnet';

  if (isMainnet) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-ink text-white">
        <span className="w-1.5 h-1.5 rounded-full bg-black/20" />
        {label}
      </span>
    );
  }

  // Testnets / unknown: tint Solana with a violet dot, Starknet with neutral.
  const dot = chain === 'solana' ? 'bg-[#9945FF]' : 'bg-black/25';
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-surface border border-line text-black/50">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export default NetworkBadge;
