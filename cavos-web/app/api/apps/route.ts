import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/apps - List all apps for user's organizations
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organization_id from query params if provided
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    let query = supabase
      .from('apps')
      .select(`
        *,
        organization:organizations(id, name, slug)
      `)
      .order('created_at', { ascending: false })

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: apps, error } = await query

    if (error) {
      console.error('Error fetching apps:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ apps })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/apps - Create a new app
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      organization_id,
      auth0_domain,
      auth0_client_id,
      auth0_client_secret,
      callback_urls,
      allowed_logout_urls,
      allowed_web_origins,
      logo_url,
      website_url,
      email_from_address,
      email_from_name,
      email_template_html,
    } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!organization_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Verify user owns the organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organization_id)
      .eq('owner_id', user.id)
      .single()

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found or unauthorized' }, { status: 403 })
    }

    // TODO: Encrypt auth0_client_secret before storing
    // For now, we'll store it as-is (not recommended for production)
    const { data: app, error } = await supabase
      .from('apps')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        organization_id,
        auth0_domain: auth0_domain || null,
        auth0_client_id: auth0_client_id || null,
        auth0_client_secret_encrypted: auth0_client_secret || null, // Should be encrypted
        callback_urls: callback_urls || null,
        allowed_logout_urls: allowed_logout_urls || null,
        allowed_web_origins: allowed_web_origins || null,
        logo_url: logo_url || null,
        website_url: website_url || null,
        email_from_address: email_from_address || null,
        email_from_name: email_from_name || null,
        email_template_html: email_template_html || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating app:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ app }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
