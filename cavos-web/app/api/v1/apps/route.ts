import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { hashApiKey } from '@/lib/api-key'

// POST /api/v1/apps
// Authorization: Bearer cav_xxxxxxxxxxxx
//
// Body: { name, organization_id, description? }
//
// Creates an app inside the given organization on behalf of the API key owner.
// Enforces per-user app count limits based on their subscription tier.
export async function POST(request: Request) {
  try {
    // 1. Extract Bearer token
    const authHeader = request.headers.get('authorization') ?? ''
    const [scheme, rawKey] = authHeader.split(' ')

    if (scheme !== 'Bearer' || !rawKey?.startsWith('cav_')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header. Expected: Bearer cav_...' },
        { status: 401 }
      )
    }

    // 2. Hash the provided key and look it up — use admin client to bypass RLS
    const admin = createAdminClient()
    const keyHash = hashApiKey(rawKey)

    const { data: apiKey, error: keyError } = await admin
      .from('organization_api_keys')
      .select('id, org_id, is_active')
      .eq('key_hash', keyHash)
      .single()

    if (keyError || !apiKey || !apiKey.is_active) {
      return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 })
    }

    // 3. Parse and validate body
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name, organization_id, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    // 4. Verify the API key belongs to the requested organization
    if (apiKey.org_id !== organization_id) {
      return NextResponse.json(
        { error: 'API key does not have access to this organization' },
        { status: 403 }
      )
    }

    // 5. Get the org owner
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .select('id, owner_id')
      .eq('id', organization_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // 6. App count limit (no tier-based limits with GasTank model)
    const APP_LIMIT = 100
    const limit = APP_LIMIT

    // 7. Count all active apps across all orgs owned by this user
    // Supabase JS doesn't support subqueries in .in(), so we fetch org IDs first
    const { data: ownerOrgs, error: orgsError } = await admin
      .from('organizations')
      .select('id')
      .eq('owner_id', org.owner_id)

    if (orgsError) {
      console.error('Error fetching orgs:', orgsError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const orgIds = (ownerOrgs ?? []).map((o: { id: string }) => o.id)

    const { count, error: countError } = await admin
      .from('apps')
      .select('id', { count: 'exact', head: true })
      .in('organization_id', orgIds)

    if (countError) {
      console.error('Error counting apps:', countError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        {
          error: `App limit reached (${count}/${limit})`,
          limit,
          current: count,
        },
        { status: 429 }
      )
    }

    // 8. Create the app
    const { data: app, error: createError } = await admin
      .from('apps')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        organization_id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating app:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // 9. Update last_used_at for the API key (fire-and-forget, non-blocking)
    admin
      .from('organization_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKey.id)
      .then(() => {})

    return NextResponse.json({ app }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}