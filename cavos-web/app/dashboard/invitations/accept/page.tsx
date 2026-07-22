'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Invitation = {
  email: string
  role: string
  organization_name: string
  account_exists: boolean
}

export default function AcceptInvitationPage() {
  return <Suspense fallback={<InvitationCard title="Join organization" text="Checking invitation…" />}><AcceptInvitation /></Suspense>
}

function AcceptInvitation() {
  const params = useSearchParams()
  const router = useRouter()
  const [title, setTitle] = useState('Join organization')
  const [state, setState] = useState('Checking invitation…')

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setState('Invitation token is missing.')
      return
    }

    const accept = async () => {
      const response = await fetch('/api/operations/team/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const body = await response.json()

      if (response.ok) {
        setState('Invitation accepted. Redirecting…')
        window.setTimeout(() => router.replace('/dashboard'), 600)
        return
      }

      if (response.status !== 401) throw new Error(body.error)

      const inspectResponse = await fetch(`/api/operations/team/accept?token=${encodeURIComponent(token)}`)
      const invitation = await inspectResponse.json() as Invitation & { error?: string }
      if (!inspectResponse.ok) throw new Error(invitation.error || 'Unable to inspect invitation')

      setTitle(`Join ${invitation.organization_name}`)
      setState(invitation.account_exists ? 'Taking you to sign in…' : 'Taking you to create your account…')
      const next = `/dashboard/invitations/accept?token=${encodeURIComponent(token)}`
      const destination = invitation.account_exists ? '/login' : '/register'
      const query = new URLSearchParams({ email: invitation.email, next })
      router.replace(`${destination}?${query.toString()}`)
    }

    accept().catch(error => setState(error instanceof Error ? error.message : 'Unable to accept invitation'))
  }, [params, router])

  return <InvitationCard title={title} text={state} />
}

function InvitationCard({ title, text }: { title: string; text: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-white p-7 text-center shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p role="status" className="mt-3 text-sm text-black/55">{text}</p>
      </div>
    </main>
  )
}
