import { NextResponse } from 'next/server'
import { generateApiKey } from '@/lib/api-key'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireOrganizationAccess } from '@/lib/operations/access'

// GET /api/organizations/[id]/api-keys — list keys for the org (no hashes returned)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params
    const access = await requireOrganizationAccess(orgId, ['owner', 'admin'])
    if (!access.ok) return NextResponse.json({ error: 'Forbidden' }, { status: access.status })

    // RLS ensures only the org owner can see these
    const { data: keys, error } = await access.supabase
      .from('organization_api_keys')
      .select('id, name, key_prefix, is_active, last_used_at, created_at, environment_id, scopes, expires_at, request_count, error_count')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching api keys:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/organizations/[id]/api-keys — generate a new API key
// Returns the plaintext key ONCE — it is never stored
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params
    const access = await requireOrganizationAccess(orgId, ['owner', 'admin'])
    if (!access.ok) return NextResponse.json({ error: 'Forbidden' }, { status: access.status })

    const body = await request.json()
    const { name, environment_id, scopes } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 })
    }

    if (!environment_id || typeof environment_id !== 'string') return NextResponse.json({ error: 'Environment is required' }, { status: 400 })
    const allowedScopes = ['read', 'write']
    const normalizedScopes = Array.isArray(scopes) ? [...new Set(scopes.filter(scope => allowedScopes.includes(scope)))] : []
    if (!normalizedScopes.length) return NextResponse.json({ error: 'At least one valid scope is required' }, { status: 400 })

    const admin = createAdminClient()
    const { data: environment } = await admin.from('app_environments').select('id,app_id').eq('id', environment_id).maybeSingle()
    if (!environment) return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
    const { data: app } = await admin.from('apps').select('id').eq('id', environment.app_id).eq('organization_id', orgId).maybeSingle()
    if (!app) return NextResponse.json({ error: 'Environment does not belong to this organization' }, { status: 403 })

    const { key, hash, prefix } = generateApiKey()

    const { data: created, error } = await admin
      .from('organization_api_keys')
      .insert({
        org_id: orgId,
        name: name.trim(),
        key_hash: hash,
        key_prefix: prefix,
        created_by: access.user.id,
        environment_id,
        scopes: normalizedScopes,
      })
      .select('id, name, key_prefix, is_active, environment_id, scopes, created_at')
      .single()

    if (error) {
      console.error('Error creating api key:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await admin.from('audit_events').insert({ organization_id: orgId, actor_id: access.user.id, action: 'api_key.created', resource_type: 'api_key', resource_id: created.id, result: 'success', changes: { environment_id, scopes: normalizedScopes } })

    return NextResponse.json({ key: created, plaintext: key }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
