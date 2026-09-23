import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_VAULT_POLICY, parseVaultPolicy, type VaultPolicy } from '@/lib/vault/policy'

// Read by the vault iframe when an app embeds it: which sites may embed it
// for this app, and what it may sign without asking.
export async function GET(request: NextRequest) {
  const appId = request.nextUrl.searchParams.get('app_id')
  if (!appId) return NextResponse.json({ error: 'Missing app_id' }, { status: 400 })

  const { data: app, error } = await createAdminClient()
    .from('apps')
    .select('allowed_web_origins,callback_urls,vault_policy,is_active')
    .eq('id', appId)
    .single()
  if (error || !app?.is_active) return NextResponse.json({ error: 'Invalid app_id' }, { status: 404 })

  let policy: VaultPolicy = DEFAULT_VAULT_POLICY
  if (app.vault_policy) {
    try {
      policy = parseVaultPolicy(app.vault_policy)
    } catch {
      // A stored policy that no longer validates must not widen anything.
      policy = { overLimit: 'ask', limits: [] }
    }
  }
  return NextResponse.json({ origins: embeddingOrigins(app.allowed_web_origins, app.callback_urls), policy })
}

/** Null when the app registered none, which leaves the vault open to any site, as redirects are. */
function embeddingOrigins(webOrigins: string[] | null, callbacks: string[] | null): string[] | null {
  const origins = new Set<string>()
  for (const url of [...(webOrigins ?? []), ...(callbacks ?? [])]) {
    try {
      const { origin } = new URL(url)
      if (origin !== 'null') origins.add(origin)
    } catch {
      // Not a URL, e.g. a native app scheme without a host.
    }
  }
  return origins.size ? [...origins] : null
}
