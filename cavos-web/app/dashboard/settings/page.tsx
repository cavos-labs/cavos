'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

type Passkey = {
  id: string
  friendly_name?: string
  created_at: string
  last_used_at?: string
}

export default function SettingsPage() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [supported, setSupported] = useState(true)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState('')

  const loadPasskeys = async () => {
    const supabase = createClient()
    const { data, error: listError } = await supabase.auth.passkey.list()
    if (listError) setError(listError.message)
    else setPasskeys(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'PublicKeyCredential' in window)
    loadPasskeys()
  }, [])

  const register = async () => {
    setError('')
    setRegistering(true)
    const supabase = createClient()
    const { error: registerError } = await supabase.auth.registerPasskey()
    setRegistering(false)
    if (registerError) {
      setError(registerError.message)
      return
    }
    await loadPasskeys()
  }

  const remove = async (passkey: Passkey) => {
    if (!window.confirm(`Remove ${passkey.friendly_name || 'this passkey'}? You will no longer be able to use it to sign in.`)) return
    setError('')
    const supabase = createClient()
    const { error: deleteError } = await supabase.auth.passkey.delete({ passkeyId: passkey.id })
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    await loadPasskeys()
  }

  return <div className="space-y-6">
    <PageHeader title="Settings" subtitle="Organization configuration, security and data controls." />

    <section className="rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div><h2 className="text-sm font-semibold">Passkeys</h2><p className="mt-1 text-xs text-black/45">Sign in with Touch ID, Face ID, Windows Hello or a security key.</p></div>
        <Button onClick={register} loading={registering} disabled={!supported || loading}>Add passkey</Button>
      </div>
      {!supported && <p className="px-5 py-4 text-sm text-black/55">This browser or device does not support passkeys.</p>}
      {error && <p role="alert" className="border-b border-line px-5 py-3 text-sm text-red-700">{error}</p>}
      {supported && loading && <p className="px-5 py-6 text-sm text-black/45">Loading passkeys…</p>}
      {supported && !loading && passkeys.map(passkey => <div key={passkey.id} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{passkey.friendly_name || 'Passkey'}</p><p className="mt-1 text-xs text-black/45">Added {new Date(passkey.created_at).toLocaleDateString()}{passkey.last_used_at ? ` · Last used ${new Date(passkey.last_used_at).toLocaleDateString()}` : ''}</p></div>
        <Button variant="ghost" size="sm" onClick={() => remove(passkey)}>Remove</Button>
      </div>)}
      {supported && !loading && !passkeys.length && <p className="px-5 py-8 text-center text-sm text-black/45">No passkeys registered.</p>}
    </section>

    <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
      <Link href="/dashboard/organizations" className="block px-5 py-4 hover:bg-surface"><p className="text-sm font-semibold">Organizations</p><p className="mt-1 text-xs text-black/45">Names, applications and ownership.</p></Link>
      <Link href="/dashboard/team" className="block px-5 py-4 hover:bg-surface"><p className="text-sm font-semibold">Access control</p><p className="mt-1 text-xs text-black/45">Members, roles and invitations.</p></Link>
      <Link href="/user-privacy" className="block px-5 py-4 hover:bg-surface"><p className="text-sm font-semibold">Privacy and retention</p><p className="mt-1 text-xs text-black/45">Cavos Events are retained for 30 days; aggregate metrics contain no event payloads.</p></Link>
    </div>
  </div>
}
