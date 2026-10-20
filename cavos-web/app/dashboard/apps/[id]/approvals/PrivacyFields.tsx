'use client'

import { Input } from '@/components/ui/Input'
import { NETWORK_NAME, type NetworkPrivacySettings, type PrivacyNetwork } from '@/lib/vault/privacy'

interface Props {
  network: PrivacyNetwork
  settings: NetworkPrivacySettings
  onChange: (patch: Partial<NetworkPrivacySettings>) => void
}

export function PrivacyFields({ network, settings, onChange }: Props) {
  const id = `privacy-${network}`
  return (
    <fieldset className="rounded-lg border border-line px-4 py-3 space-y-3">
      <legend className="px-1 text-sm font-medium text-ink">{NETWORK_NAME[network]}</legend>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="accent-brand"
        />
        <span className="text-sm text-ink">Enable private transfers on {NETWORK_NAME[network]}</span>
      </label>
      {settings.enabled && (
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.sponsor}
              onChange={(e) => onChange({ sponsor: e.target.checked })}
              className="mt-0.5 accent-brand"
            />
            <span>
              <span className="block text-sm text-ink">Sponsor private transfers (charged to your gas tank)</span>
              <span className="block text-sm text-muted mt-0.5">Off, users pay the fee in STRK from their own balance.</span>
            </span>
          </label>
          <div>
            <label htmlFor={`${id}-prover`} className="block text-sm font-medium text-ink mb-1">
              Prover URL
            </label>
            <Input
              id={`${id}-prover`}
              value={settings.prover}
              onChange={(e) => onChange({ prover: e.target.value })}
              placeholder="https://prover.example.com"
              className="font-mono text-xs h-9"
            />
          </div>
          <div>
            <label htmlFor={`${id}-discovery`} className="block text-sm font-medium text-ink mb-1">
              Discovery URL
            </label>
            <Input
              id={`${id}-discovery`}
              value={settings.discovery}
              onChange={(e) => onChange({ discovery: e.target.value })}
              placeholder="https://discovery.example.com"
              className="font-mono text-xs h-9"
            />
          </div>
          <div>
            <label htmlFor={`${id}-rpc`} className="block text-sm font-medium text-ink mb-1">
              RPC URL <span className="font-normal text-muted">(optional)</span>
            </label>
            <Input
              id={`${id}-rpc`}
              value={settings.rpcUrl ?? ''}
              onChange={(e) => onChange({ rpcUrl: e.target.value })}
              placeholder="https://rpc.example.com"
              className="font-mono text-xs h-9"
            />
            <p className="text-xs text-muted mt-1">Proofs need RPC spec 0.10.1 or newer.</p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.ohttp ?? true}
              onChange={(e) => onChange({ ohttp: e.target.checked })}
              className="mt-0.5 accent-brand"
            />
            <span>
              <span className="block text-sm text-ink">Encrypt requests with OHTTP</span>
              <span className="block text-sm text-muted mt-0.5">
                Keeps the prover and discovery service from reading the viewing key. Recommended.
              </span>
            </span>
          </label>
        </div>
      )}
    </fieldset>
  )
}
