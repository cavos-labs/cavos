'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { OrganizationPicker } from '@/components/OrganizationPicker'
import { useOrganization } from '@/lib/hooks/useOrganization'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'

type Member = { user_id: string; role: string; created_at: string }
type Invitation = { id: string; email: string; role: string; expires_at: string; accepted_at: string | null; created_at: string }

export default function TeamPage() {
  const { organizations, organizationId, setOrganizationId, loading } = useOrganization()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('developer')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ url: string; emailSent: boolean } | null>(null)
  const [copied, setCopied] = useState(false)

  const loadTeam = useCallback(async () => {
    if (!organizationId) return
    const response = await fetch(`/api/operations/team?organization_id=${organizationId}`)
    const body = await response.json()
    if (response.ok) { setMembers(body.members ?? []); setInvitations(body.invitations ?? []) }
  }, [organizationId])

  useEffect(() => { loadTeam() }, [loadTeam])

  const invite = async (event: FormEvent) => {
    event.preventDefault(); setSubmitting(true); setError(''); setResult(null)
    try {
      const response = await fetch('/api/operations/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organization_id: organizationId, email, role }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Could not create invitation')
      setResult({ url: body.accept_url, emailSent: body.email_sent }); setEmail(''); await loadTeam()
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create invitation') }
    finally { setSubmitting(false) }
  }

  const copyLink = async () => { if (!result) return; await navigator.clipboard.writeText(result.url); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  if (loading) return <PageSkeleton />

  return <div className="space-y-6">
    <PageHeader title="Team" subtitle="Invite teammates and assign only the access they need." actions={<OrganizationPicker items={organizations} value={organizationId} onChange={setOrganizationId} />} />

    <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
      <div><h2 className="text-sm font-semibold">Invite teammate</h2><p className="mt-1 text-xs text-black/50">Invitations expire after seven days and must be accepted using the invited email.</p></div>
      <form onSubmit={invite} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
        <label className="space-y-1.5"><span className="text-xs font-semibold text-black/60">Email</span><input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="developer@company.com" className="w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-brand" /></label>
        <label className="space-y-1.5"><span className="text-xs font-semibold text-black/60">Role</span><select value={role} onChange={event => setRole(event.target.value)} className="w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"><option value="admin">Admin</option><option value="developer">Developer</option><option value="support">Support</option><option value="billing">Billing</option><option value="viewer">Viewer</option></select></label>
        <div className="flex items-end"><Button type="submit" loading={submitting} disabled={!organizationId || submitting} className="w-full sm:w-auto">Send invite</Button></div>
      </form>
      {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {result && <div role="status" className={`mt-4 rounded-lg border p-4 ${result.emailSent ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}><p className="text-sm font-semibold">{result.emailSent ? 'Invitation email sent' : 'Invitation created, but email delivery failed'}</p><p className="mt-1 text-xs text-black/55">{result.emailSent ? 'You can also copy the invitation link.' : 'Share this link manually with the teammate.'}</p><div className="mt-3 flex gap-2"><code className="min-w-0 flex-1 truncate rounded-md bg-white/70 px-3 py-2 font-mono text-xs">{result.url}</code><button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-3 py-2 text-xs font-semibold active:scale-[.97]">{copied ? <Icon.Check size={14}/> : <Icon.Copy size={14}/>} {copied ? 'Copied' : 'Copy'}</button></div></div>}
    </section>

    <div className="grid gap-5 lg:grid-cols-2">
      <TeamList title="Members" count={members.length}>{members.map(member => <Row key={member.user_id} primary={`${member.user_id.slice(0, 8)}••••${member.user_id.slice(-4)}`} secondary={`Joined ${new Date(member.created_at).toLocaleDateString()}`} role={member.role} />)}{!members.length && <Empty>No membership rows yet. The organization owner still has full access.</Empty>}</TeamList>
      <TeamList title="Pending invitations" count={invitations.filter(item => !item.accepted_at).length}>{invitations.filter(item => !item.accepted_at).map(invitation => <Row key={invitation.id} primary={invitation.email} secondary={`Expires ${new Date(invitation.expires_at).toLocaleDateString()}`} role={invitation.role} />)}{!invitations.some(item => !item.accepted_at) && <Empty>No pending invitations.</Empty>}</TeamList>
    </div>
  </div>
}

function TeamList({ title, count, children }: { title: string; count: number; children: React.ReactNode }) { return <section className="overflow-hidden rounded-xl border border-line bg-white"><div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="text-sm font-semibold">{title}</h2><span className="font-mono text-xs text-black/40">{count}</span></div><div className="divide-y divide-line/70">{children}</div></section> }
function Row({ primary, secondary, role }: { primary: string; secondary: string; role: string }) { return <div className="flex items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{primary}</p><p className="mt-1 text-xs text-black/40">{secondary}</p></div><span className="rounded-md bg-surface px-2 py-1 text-xs font-semibold capitalize">{role}</span></div> }
function Empty({ children }: { children: React.ReactNode }) { return <p className="px-5 py-10 text-center text-sm text-black/45">{children}</p> }
