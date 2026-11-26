import { NextRequest, NextResponse } from 'next/server'
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier'
import { externalIdentityOf, fetchExternalKeys } from '@/lib/identity/external'

// Read by the vault to verify a token of the identity provider an app
// registered for itself. Served from here so the vault needs no cross-origin
// access to the provider.
export async function GET(request: NextRequest) {
  const identifier = request.nextUrl.searchParams.get('app_id')
  if (!identifier) return NextResponse.json({ error: 'Missing app_id' }, { status: 400 })

  const resolved = await resolveAppIdentifier(identifier)
  const identity = resolved?.environmentId ? await externalIdentityOf(resolved.environmentId) : null
  if (!identity) return NextResponse.json({ error: 'This app has no identity provider' }, { status: 404 })

  try {
    return NextResponse.json(await fetchExternalKeys(identity.jwksUrl), {
      headers: { 'Cache-Control': 'public, max-age=300' },
    })
  } catch {
    return NextResponse.json({ error: 'The identity provider keys are unavailable' }, { status: 502 })
  }
}
