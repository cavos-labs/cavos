'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { OrganizationPicker } from '@/components/OrganizationPicker'
import { Button } from '@/components/ui/Button'
import { useOrganization } from '@/lib/hooks/useOrganization'

type App = { id: string; name: string }
type Environment = { id: string; public_id: string; kind: 'development' | 'production' }
type ApiKey = { id: string; name: string; key_prefix: string; environment_id: string | null; scopes: string[]; last_used_at: string | null; request_count: number; error_count: number }

export default function ApiKeysPage() {
  const { organizations, organizationId, setOrganizationId, loading } = useOrganization()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [appId, setAppId] = useState('')
  const [environmentId, setEnvironmentId] = useState('')
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>(['read'])
  const [plaintext, setPlaintext] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const loadKeys = useCallback(() => {
    if (!organizationId) return
    fetch(`/api/organizations/${organizationId}/api-keys`).then(response => response.json()).then(data => setKeys(data.keys ?? []))
  }, [organizationId])

  useEffect(() => {
    if (!organizationId) return
    setPlaintext('')
    loadKeys()
    fetch(`/api/apps?organization_id=${organizationId}`).then(response => response.json()).then(data => {
      const nextApps = data.apps ?? []
      setApps(nextApps)
      setAppId(nextApps[0]?.id ?? '')
    })
  }, [organizationId, loadKeys])

  useEffect(() => {
    setEnvironments([])
    setEnvironmentId('')
    if (!appId) return
    fetch(`/api/apps/${appId}/environments`).then(response => response.json()).then(data => {
      const nextEnvironments = data.environments ?? []
      setEnvironments(nextEnvironments)
      setEnvironmentId(nextEnvironments.find((environment: Environment) => environment.kind === 'development')?.id ?? nextEnvironments[0]?.id ?? '')
    }).catch(() => setError('Unable to load environments.'))
  }, [appId])

  const toggleScope = (scope: string) => setScopes(current => current.includes(scope) ? current.filter(item => item !== scope) : [...current, scope])

  const createKey = async () => {
    if (!organizationId) return
    setCreating(true)
    setError('')
    setPlaintext('')
    const response = await fetch(`/api/organizations/${organizationId}/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, environment_id: environmentId, scopes }),
    })
    const body = await response.json()
    setCreating(false)
    if (!response.ok) {
      setError(body.error || 'Unable to create API key.')
      return
    }
    setPlaintext(body.plaintext)
    setName('')
    loadKeys()
  }

  if (loading) return <PageSkeleton />

  return <div className="space-y-6">
    <PageHeader title="API keys" subtitle="Environment-scoped credentials and usage." actions={<OrganizationPicker items={organizations} value={organizationId} onChange={setOrganizationId} />} />

    <section className="rounded-xl border border-line bg-white p-5">
      <div>
        <h2 className="text-sm font-semibold">Create API key</h2>
        <p className="mt-1 text-xs text-black/45">The plaintext key is shown once. Store it securely.</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr_auto_auto]">
        <input aria-label="Key name" value={name} onChange={event => setName(event.target.value)} placeholder="Backend production" className="h-10 rounded-lg border border-line-strong px-3 text-sm focus-visible:outline-2 focus-visible:outline-brand" />
        <select aria-label="App" value={appId} onChange={event => setAppId(event.target.value)} className="h-10 rounded-lg border border-line-strong px-3 text-sm">
          {apps.length ? apps.map(app => <option key={app.id} value={app.id}>{app.name}</option>) : <option value="">No apps</option>}
        </select>
        <select aria-label="Environment" value={environmentId} onChange={event => setEnvironmentId(event.target.value)} disabled={!environments.length} className="h-10 rounded-lg border border-line-strong px-3 text-sm disabled:bg-black/[0.03] disabled:text-black/40">
          <option value="">{environments.length ? 'Select environment' : 'No environments'}</option>
          {environments.map(environment => <option key={environment.id} value={environment.id}>{environment.kind === 'production' ? 'Production' : 'Development'} · {environment.public_id}</option>)}
        </select>
        <div className="flex h-10 items-center gap-3 rounded-lg border border-line-strong px-3">
          {['read', 'write'].map(scope => <label key={scope} className="flex items-center gap-1.5 text-xs capitalize"><input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} className="accent-brand" />{scope}</label>)}
        </div>
        <Button onClick={createKey} loading={creating} disabled={!name.trim() || !environmentId || !scopes.length}>Create key</Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {plaintext && <div role="status" className="mt-4 rounded-lg border border-brand/25 bg-brand/[0.04] p-4"><p className="text-xs font-semibold text-brand">Copy this key now. It cannot be retrieved again.</p><code className="mt-2 block break-all font-mono text-xs text-black/75">{plaintext}</code></div>}
    </section>

    <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
      {keys.map(key => <div key={key.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{key.name}</p><code className="text-xs text-black/45">{key.key_prefix}••••••••</code></div>
        <p className="text-xs text-black/45">{key.scopes?.join(', ') || 'No scopes'}</p>
        <div className="text-right"><p className="text-xs text-black/50">Last used {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</p><p className="mt-1 text-xs text-black/40">{key.request_count ?? 0} requests · {key.error_count ?? 0} errors</p></div>
      </div>)}
      {!keys.length && <p className="py-12 text-center text-sm text-black/45">No API keys for this organization.</p>}
    </div>
  </div>
}
