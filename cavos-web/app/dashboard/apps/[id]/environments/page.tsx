'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { EnvironmentBadge } from '@/components/EnvironmentBadge'
import { Icon } from '@/components/ui/Icon'

type Provider = 'google' | 'apple' | 'email'

interface Environment {
  id: string
  public_id: string
  kind: 'development' | 'production'
  is_active: boolean
  social_recovery_enabled: boolean
  social_recovery_provider: Provider | null
  social_recovery_audiences: Partial<Record<Provider, string>> | null
  github_client_id: string | null
  github_client_secret_set: boolean
}

/** Every provider is available once recovery is on; these only set whose client. */
const PROVIDER_FIELDS: { provider: Provider; label: string; hint: string }[] = [
  { provider: 'google', label: 'Google client ID', hint: 'OAuth client ID' },
  { provider: 'apple', label: 'Apple client ID', hint: 'Services ID' },
  { provider: 'email', label: 'Firebase project ID', hint: 'Project ID, not a client ID' },
]

export default function EnvironmentsPage() {
  const { id } = useParams<{ id: string }>()
  const [items, setItems] = useState<Environment[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState('')
  const [saving, setSaving] = useState('')
  const [message, setMessage] = useState<Record<string, string>>({})
  const [githubSecrets, setGithubSecrets] = useState<Record<string, string>>({})
  const [githubSaving, setGithubSaving] = useState('')
  const [githubMessage, setGithubMessage] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/apps/${id}/environments`)
      .then((r) => r.json())
      .then((d) => setItems(d.environments ?? []))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageSkeleton />

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(value)
    setTimeout(() => setCopied(''), 1500)
  }

  const updateLocal = (environmentId: string, patch: Partial<Environment>) => {
    setItems((current) =>
      current.map((environment) =>
        environment.id === environmentId ? { ...environment, ...patch } : environment,
      ),
    )
  }

  const saveRecovery = async (environment: Environment) => {
    setSaving(environment.id)
    setMessage((current) => ({ ...current, [environment.id]: '' }))
    try {
      const response = await fetch(`/api/apps/${id}/environments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment_id: environment.id,
          social_recovery_enabled: environment.social_recovery_enabled,
          social_recovery_audiences: environment.social_recovery_audiences ?? {},
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Could not save recovery policy')
      updateLocal(environment.id, body.environment)
      setMessage((current) => ({ ...current, [environment.id]: 'Saved' }))
    } catch (error) {
      setMessage((current) => ({
        ...current,
        [environment.id]: error instanceof Error ? error.message : 'Could not save',
      }))
    } finally {
      setSaving('')
    }
  }

  const saveGithub = async (environment: Environment) => {
    setGithubSaving(environment.id)
    setGithubMessage((current) => ({ ...current, [environment.id]: '' }))
    try {
      const clientId = (environment.github_client_id ?? '').trim()
      const secret = githubSecrets[environment.id] ?? ''
      const response = await fetch(`/api/apps/${id}/environments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment_id: environment.id,
          github_client_id: clientId,
          ...(secret ? { github_client_secret: secret } : {}),
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Could not save GitHub sign-in')
      updateLocal(environment.id, body.environment)
      setGithubSecrets((current) => ({ ...current, [environment.id]: '' }))
      setGithubMessage((current) => ({ ...current, [environment.id]: 'Saved' }))
    } catch (error) {
      setGithubMessage((current) => ({
        ...current,
        [environment.id]: error instanceof Error ? error.message : 'Could not save',
      }))
    } finally {
      setGithubSaving('')
    }
  }

  const githubCallback = `${window.location.origin}/api/oauth/github/callback`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Environments"
        subtitle="Development and Production keep configuration, credentials and operational data separate."
      />
      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
        {items.map((env) => (
          <section key={env.id} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <EnvironmentBadge kind={env.kind} />
                <h2 className="mt-3 text-base font-semibold">
                  {env.kind === 'production' ? 'Production' : 'Development'}
                </h2>
                <p className="mt-1 text-sm text-black/50">
                  {env.kind === 'production'
                    ? 'Existing App IDs resolve here for backwards compatibility.'
                    : 'Use this environment for isolated integration testing.'}
                </p>
              </div>
              <span
                className={`text-xs font-semibold ${
                  env.is_active ? 'text-emerald-700' : 'text-black/40'
                }`}
              >
                {env.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mt-5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                Environment ID
              </label>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-3 py-2.5 font-mono text-xs text-black/65">
                  {env.public_id}
                </code>
                <button
                  onClick={() => copy(env.public_id)}
                  className="rounded-lg border border-line px-3 py-2.5 text-xs font-semibold transition-transform active:scale-[.97] focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {copied === env.public_id ? <Icon.Check size={14} /> : <Icon.Copy size={14} />}
                  <span className="sr-only">Copy environment ID</span>
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-line bg-surface/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <h3 className="text-sm font-semibold">Hardware-isolated social recovery</h3>
                  <p className="mt-1 text-xs leading-5 text-black/50">
                    Google, Apple and email are all accepted; each wallet recovers through the
                    provider its owner signed in with. Recovery credentials and keys are
                    processed only inside an attested AWS Nitro Enclave.
                  </p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={env.social_recovery_enabled}
                    onChange={(event) =>
                      updateLocal(env.id, {
                        social_recovery_enabled: event.target.checked,
                        social_recovery_provider: event.target.checked
                          ? env.social_recovery_provider ?? 'google'
                          : env.social_recovery_provider,
                      })
                    }
                    className="size-4 accent-brand"
                  />
                  Enabled
                </label>
              </div>

              {env.social_recovery_enabled && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-line p-4">
                    <p className="text-xs font-semibold">Bring your own auth</p>
                    <p className="mt-2 text-xs text-muted">
                      Leave these empty and recovery uses Cavos&apos;s own clients. Fill one in
                      if you sign users in yourself (Clerk, Auth0, your own backend) and
                      recovery will accept the id_token you already hold, so the user never
                      signs in twice. Wallets already enrolled keep the client they enrolled
                      with.
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      {PROVIDER_FIELDS.map((field) => (
                        <label key={field.provider} className="text-xs font-semibold">
                          {field.label}
                          <input
                            type="text"
                            spellCheck={false}
                            placeholder={field.hint}
                            value={env.social_recovery_audiences?.[field.provider] ?? ''}
                            onChange={(event) =>
                              updateLocal(env.id, {
                                social_recovery_audiences: {
                                  ...(env.social_recovery_audiences ?? {}),
                                  [field.provider]: event.target.value,
                                },
                              })
                            }
                            className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 font-mono text-xs"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => saveRecovery(env)}
                  disabled={saving === env.id}
                  className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {saving === env.id ? 'Saving…' : 'Save recovery policy'}
                </button>
                {message[env.id] && (
                  <span
                    className={`text-xs ${
                      message[env.id] === 'Saved' ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {message[env.id]}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-line bg-surface/40 p-4">
              <h3 className="text-sm font-semibold">GitHub sign-in</h3>
              <p className="mt-1 max-w-xl text-xs leading-5 text-black/50">
                Leave empty to use Cavos&apos;s GitHub app. Switching apps gives every GitHub
                user in this environment a new identity and a new, empty wallet.
              </p>
              <div className="mt-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                  Authorization callback URL
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-3 py-2.5 font-mono text-xs text-black/65">
                    {githubCallback}
                  </code>
                  <button
                    onClick={() => copy(githubCallback)}
                    className="rounded-lg border border-line px-3 py-2.5 text-xs font-semibold transition-transform active:scale-[.97] focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    {copied === githubCallback ? <Icon.Check size={14} /> : <Icon.Copy size={14} />}
                    <span className="sr-only">Copy GitHub callback URL</span>
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold">
                  GitHub client ID
                  <input
                    type="text"
                    spellCheck={false}
                    placeholder="OAuth app client ID"
                    value={env.github_client_id ?? ''}
                    onChange={(event) => updateLocal(env.id, { github_client_id: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 font-mono text-xs"
                  />
                </label>
                <label className="text-xs font-semibold">
                  GitHub client secret
                  <input
                    type="password"
                    autoComplete="off"
                    placeholder={
                      env.github_client_secret_set ? 'Saved — leave empty to keep' : 'OAuth app client secret'
                    }
                    value={githubSecrets[env.id] ?? ''}
                    onChange={(event) =>
                      setGithubSecrets((current) => ({ ...current, [env.id]: event.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 font-mono text-xs"
                  />
                </label>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => saveGithub(env)}
                  disabled={githubSaving === env.id}
                  className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {githubSaving === env.id ? 'Saving…' : 'Save GitHub sign-in'}
                </button>
                {githubMessage[env.id] && (
                  <span
                    className={`text-xs ${
                      githubMessage[env.id] === 'Saved' ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {githubMessage[env.id]}
                  </span>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
