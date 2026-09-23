'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  DEFAULT_VAULT_POLICY,
  isValidAsset,
  type OverLimit,
  type VaultChain,
  type VaultLimit,
  type VaultPolicy,
} from '@/lib/vault/policy'

const OVER_LIMIT: { value: OverLimit; title: string; detail: string }[] = [
  {
    value: 'ask',
    title: 'Ask the user',
    detail: 'Cavos shows the transaction and waits for the user to approve it. Recommended.',
  },
  {
    value: 'block',
    title: 'Block it',
    detail: 'The transaction is not signed and your app receives an error.',
  },
  {
    value: 'sign',
    title: 'Sign without asking',
    detail: 'Cavos signs it anyway. Any script running on your site could then move a user’s full balance.',
  },
]

const KNOWN_ASSETS: { chain: VaultChain; asset: string; label: string }[] = [
  { chain: 'solana', asset: 'SOL', label: 'SOL' },
  { chain: 'solana', asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', label: 'USDC' },
  { chain: 'solana', asset: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', label: 'USDC (devnet)' },
  { chain: 'stellar', asset: 'XLM', label: 'XLM' },
  { chain: 'stellar', asset: 'USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', label: 'USDC' },
  { chain: 'stellar', asset: 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', label: 'USDC (testnet)' },
]

const CHAIN_NAME: Record<VaultChain, string> = { solana: 'Solana', stellar: 'Stellar' }

function knownLabel(limit: VaultLimit): string | undefined {
  return KNOWN_ASSETS.find((known) => known.chain === limit.chain && known.asset === limit.asset)?.label
}

export default function ApprovalsPage() {
  const params = useParams()
  const appId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [policy, setPolicy] = useState<VaultPolicy>(DEFAULT_VAULT_POLICY)

  useEffect(() => {
    if (!appId) return
    fetch(`/api/apps/${appId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setPolicy((data.app.vault_policy as VaultPolicy | null) ?? DEFAULT_VAULT_POLICY))
      .catch(() => setError('Could not load this app.'))
      .finally(() => setLoading(false))
  }, [appId])

  const update = (next: Partial<VaultPolicy>) => {
    setSaved(false)
    setPolicy((current) => ({ ...current, ...next }))
  }

  const updateLimit = (index: number, patch: Partial<VaultLimit>) =>
    update({ limits: policy.limits.map((limit, i) => (i === index ? { ...limit, ...patch } : limit)) })

  const addLimit = (limit: VaultLimit) => update({ limits: [...policy.limits, limit] })

  const removeLimit = (index: number) => update({ limits: policy.limits.filter((_, i) => i !== index) })

  const save = async () => {
    const invalid = policy.limits.findIndex((limit) => !isValidAsset(limit.chain, limit.asset.trim()))
    if (invalid >= 0) {
      setError(`Row ${invalid + 1}: enter SOL or a mint address on Solana, XLM or CODE:ISSUER on Stellar.`)
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vault_policy: policy }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save the policy.')
      setPolicy(data.app.vault_policy ?? DEFAULT_VAULT_POLICY)
      setSaved(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Icon.Spinner className="w-8 h-8 animate-spin text-black/20" />
      </div>
    )
  }

  const unused = KNOWN_ASSETS.filter(
    (known) => !policy.limits.some((limit) => limit.chain === known.chain && limit.asset === known.asset),
  )

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <PageHeader
        title="Transaction approvals"
        subtitle="What the Cavos vault signs for your users without asking, on Solana and Stellar. Your site cannot change these; only this page can."
      />

      <Card className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Over the limit</h2>
          <p className="text-sm text-muted mt-1">
            Applies to transfers above a limit, tokens with no limit, and anything else the vault cannot read as a
            transfer, like contract calls or signer changes.
          </p>
        </div>
        <div role="radiogroup" aria-label="Over the limit" className="space-y-2">
          {OVER_LIMIT.map((option) => {
            const selected = policy.overLimit === option.value
            return (
              <label
                key={option.value}
                className={`flex gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors duration-150 ${
                  selected ? 'border-line-strong bg-surface' : 'border-line hover:bg-black/[0.02]'
                }`}
              >
                <input
                  type="radio"
                  name="over-limit"
                  value={option.value}
                  checked={selected}
                  onChange={() => update({ overLimit: option.value })}
                  className="mt-0.5 accent-brand"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">{option.title}</span>
                  <span className="block text-sm text-muted mt-0.5">{option.detail}</span>
                </span>
              </label>
            )
          })}
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Limits</h2>
          <p className="text-sm text-muted mt-1">
            Per user, in whole units of each token. The daily total resets at 00:00 UTC, and transfers the user
            approves themselves do not count toward it.
          </p>
        </div>

        {policy.limits.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-sm text-muted text-center">
            No limits. Every transfer follows the rule above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="font-medium pb-2 pr-3 w-28">Chain</th>
                  <th className="font-medium pb-2 pr-3">Token</th>
                  <th className="font-medium pb-2 pr-3 w-36">Per transaction</th>
                  <th className="font-medium pb-2 pr-3 w-36">Per day</th>
                  <th className="pb-2 w-10">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {policy.limits.map((limit, index) => {
                  const label = knownLabel(limit)
                  return (
                    <tr key={index} className="border-t border-line align-top">
                      <td className="py-2 pr-3">
                        <select
                          aria-label={`Chain for row ${index + 1}`}
                          value={limit.chain}
                          onChange={(e) => updateLimit(index, { chain: e.target.value as VaultChain })}
                          className="w-full h-9 bg-white border border-line rounded-lg px-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-black/5"
                        >
                          <option value="solana">Solana</option>
                          <option value="stellar">Stellar</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          aria-label={`Token for row ${index + 1}`}
                          value={limit.asset}
                          onChange={(e) => updateLimit(index, { asset: e.target.value })}
                          placeholder={limit.chain === 'solana' ? 'SOL or mint address' : 'XLM or CODE:ISSUER'}
                          className="font-mono text-xs h-9"
                        />
                        {label && <p className="text-xs text-muted mt-1">{label}</p>}
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          aria-label={`Per-transaction limit for row ${index + 1}`}
                          inputMode="decimal"
                          value={limit.perTx}
                          onChange={(e) => updateLimit(index, { perTx: e.target.value })}
                          className="tabular-nums h-9"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          aria-label={`Daily limit for row ${index + 1}`}
                          inputMode="decimal"
                          value={limit.perDay}
                          onChange={(e) => updateLimit(index, { perDay: e.target.value })}
                          className="tabular-nums h-9"
                        />
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => removeLimit(index)}
                          className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-black/[0.04] transition-colors"
                          aria-label={`Remove ${label ?? limit.asset}`}
                        >
                          <Icon.Close className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {unused.map((known) => (
            <Button
              key={`${known.chain}:${known.asset}`}
              variant="outline"
              size="sm"
              onClick={() => addLimit({ chain: known.chain, asset: known.asset, perTx: '', perDay: '' })}
            >
              <Icon.Add className="w-3.5 h-3.5 mr-1" />
              {known.label} on {CHAIN_NAME[known.chain]}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addLimit({ chain: 'solana', asset: '', perTx: '', perDay: '' })}
          >
            <Icon.Add className="w-3.5 h-3.5 mr-1" />
            Other token
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => update(DEFAULT_VAULT_POLICY)}>
          Restore Cavos defaults
        </Button>
        <div className="flex items-center gap-3">
          <p role="status" className="text-sm">
            {error ? <span className="text-danger">{error}</span> : saved ? <span className="text-muted">Saved.</span> : null}
          </p>
          <Button onClick={save} loading={saving}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
