'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'

// Common Solana programs developers may want their wallets to call. The relayer
// always allows the safe set (System, SPL Token, Token-2022, Associated Token);
// these presets are the popular ADDITIONAL programs that need an explicit allow.
const COMMON_PROGRAMS: { id: string; label: string }[] = [
  { id: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', label: 'Jupiter v6' },
  { id: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33nhcij2', label: 'Jupiter v4' },
  { id: 'Ehh7rz8RTJcu6iF8FuiXmDGpR6Z5tSys76rPcPtrP5mZ', label: 'Jupiter Swap' },
  { id: 'MERLuDFBMmsHnsBPZV2crqHpXqzjvqdVdPg1iYZ3yTQ', label: 'Meteora' },
  { id: 'CAMinozoN6HnPi2F7KiCdco1RF6k1kshayedUPyUMWt8', label: 'Raydium CLMM' },
  { id: 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD', label: 'Marinade (staking)' },
  { id: 'Stake11111111111111111111111111111111111111', label: 'Stake' },
  { id: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr', label: 'Memo' },
]

export default function ProgramsPage() {
  const params = useParams()
  const appId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [allowed, setAllowed] = useState<string[]>([])
  const [newProgram, setNewProgram] = useState('')

  useEffect(() => {
    if (appId) fetchApp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId])

  const fetchApp = async () => {
    try {
      const res = await fetch(`/api/apps/${appId}`)
      if (!res.ok) throw new Error('Failed to fetch app')
      const data = await res.json()
      setAllowed(data.app.allowed_solana_programs ?? [])
    } catch {
      setError('Failed to load application')
    } finally {
      setLoading(false)
    }
  }

  const addProgram = (id: string) => {
    const clean = id.trim()
    if (!clean) return
    if (clean.length < 32 || clean.length > 44) {
      setError(`"${clean}" doesn't look like a Solana program id (32–44 base58 chars).`)
      return
    }
    if (allowed.includes(clean)) return
    setError('')
    setAllowed([...allowed, clean])
    setNewProgram('')
  }

  const removeProgram = (id: string) => {
    setAllowed(allowed.filter((p) => p !== id))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowed_solana_programs: allowed }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
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

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      <Link
        href={`/dashboard/apps/${appId}`}
        className="inline-flex items-center text-sm text-black/60 hover:text-black transition-colors"
      >
        <Icon.ArrowLeft className="w-4 h-4 mr-1" />
        Back to app
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-black">Allowed Solana Programs</h1>
        <p className="text-black/60 mt-1">
          Programs your wallets may call via sponsored <code className="text-sm bg-black/5 px-1.5 py-0.5 rounded">execute</code>.
          The relayer always allows the safe set (System, SPL Token, Token-2022, Associated Token);
          add any additional programs your app needs.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Common presets */}
        <div>
          <h2 className="text-sm font-semibold text-black mb-3">Common programs</h2>
          <div className="flex flex-wrap gap-2">
            {COMMON_PROGRAMS.map((p) => {
              const added = allowed.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => (added ? removeProgram(p.id) : addProgram(p.id))}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    added
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black/70 border-black/15 hover:border-black/40'
                  }`}
                  title={p.id}
                >
                  {added ? '✓ ' : '+ '}
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom program id */}
        <div>
          <h2 className="text-sm font-semibold text-black mb-3">Custom program</h2>
          <div className="flex gap-2">
            <Input
              value={newProgram}
              onChange={(e: any) => setNewProgram(e.target.value)}
              placeholder="Program id (base58)"
              className="font-mono text-sm"
            />
            <Button onClick={() => addProgram(newProgram)} variant="outline">
              Add
            </Button>
          </div>
        </div>

        {/* Current allowlist */}
        <div>
          <h2 className="text-sm font-semibold text-black mb-3">
            Allowed ({allowed.length})
          </h2>
          {allowed.length === 0 ? (
            <p className="text-sm text-black/40 italic">
              No additional programs. Wallets can still call the safe set (token transfers, etc.).
            </p>
          ) : (
            <ul className="space-y-2">
              {allowed.map((id) => (
                <li
                  key={id}
                  className="flex items-center justify-between gap-3 bg-black/[0.02] border border-black/10 rounded-lg px-3 py-2"
                >
                  <code className="text-sm text-black/80 truncate">{id}</code>
                  <button
                    onClick={() => removeProgram(id)}
                    className="text-black/40 hover:text-red-500 transition-colors shrink-0"
                    aria-label={`Remove ${id}`}
                  >
                    <Icon.Close className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-600">Saved. Wallets can now call these programs.</p>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save allowlist'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
