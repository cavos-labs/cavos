import { networkLabel } from '@/lib/constants/networks'

export function NetworkBadge({ network }: { network: string }) {
  return <span className="text-sm font-medium text-muted">{networkLabel(network)}</span>
}

export default NetworkBadge
