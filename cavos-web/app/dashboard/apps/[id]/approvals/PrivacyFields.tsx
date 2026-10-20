'use client'

import { Input } from '@/components/ui/Input'
import { NETWORK_NAME, PRIVACY_DEFAULTS, type NetworkPrivacySettings, type PrivacyNetwork } from '@/lib/vault/privacy'

interface Props {
  network: PrivacyNetwork
  settings: NetworkPrivacySettings
  onChange: (patch: Partial<NetworkPrivacySettings>) => void
}

const OVERRIDES = [
  { key: 'prover', label: 'Prover URL' },
  { key: 'discovery', label: 'Discovery URL' },
  { key: 'rpcUrl', label: 'RPC URL' },
] as const

export function PrivacyFields({ network, settings, onChange }: Props) {
  const id = `privacy-${network}`
  const defaults = PRIVACY_DEFAULTS[network]
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
          <details className="group">
            <summary className="text-sm text-muted cursor-pointer select-none">
              Services <span className="text-xs">(StarkWare-hosted by default)</span>
            </summary>
            <div className="space-y-3 pt-3">
              {OVERRIDES.map(({ key, label }) => (
                <div key={key}>
                  <label htmlFor={`${id}-${key}`} className="block text-sm font-medium text-ink mb-1">
                    {label} <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <Input
                    id={`${id}-${key}`}
                    value={settings[key] ?? ''}
                    onChange={(e) => onChange({ [key]: e.target.value })}
                    placeholder={defaults[key] ?? 'Cavos default'}
                    className="font-mono text-xs h-9"
                  />
                </div>
              ))}
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
          </details>
        </div>
      )}
    </fieldset>
  )
}
