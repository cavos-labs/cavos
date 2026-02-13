import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateApiKey } from '@/lib/api-key'

// GET /api/organizations/[id]/api-keys — list keys for the org (no hashes returned)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // RLS ensures only the org owner can see these
    const { data: keys, error } = await supabase
      .from('organization_api_keys')
      .select('id, name, key_prefix, is_active, last_used_at, created_at')
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
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 })
    }

    // Verify user owns this org (RLS also enforces on insert, but early check gives better error)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .eq('owner_id', user.id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found or unauthorized' }, { status: 403 })
    }

    const { key, hash, prefix } = generateApiKey()

    const { data: created, error } = await supabase
      .from('organization_api_keys')
      .insert({
        org_id: orgId,
        name: name.trim(),
        key_hash: hash,
        key_prefix: prefix,
        created_by: user.id,
      })
      .select('id, name, key_prefix, is_active, created_at')
      .single()

    if (error) {
      console.error('Error creating api key:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return the plaintext key only here — never stored, never retrievable again
    return NextResponse.json({ key: created, plaintext: key }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}