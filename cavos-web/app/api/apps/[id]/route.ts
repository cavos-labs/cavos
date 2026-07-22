import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/apps/[id] - Get a specific app
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: app, error } = await supabase
      .from('apps')
      .select(`
        *,
        organization:organizations!inner(id, name, slug, owner_id)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'App not found' }, { status: 404 })
      }
      console.error('Error fetching app:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ app })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/apps/[id] - Update an app
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First verify ownership
    const { data: existingApp, error: fetchError } = await supabase
      .from('apps')
      .select(`
        id,
        organization:organizations!inner(owner_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingApp) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    const organization = existingApp.organization as unknown as { owner_id: string }
    if (organization.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      auth0_domain,
      auth0_client_id,
      auth0_client_secret,
      callback_urls,
      allowed_logout_urls,
      allowed_web_origins,
      logo_url,
      website_url,
      is_active,
      email_reply_to,
      email_from_name,
      email_template_html,
      email_password_reset_template_html,
      email_magic_link_template_html,
      email_otp_template_html,
      email_device_approval_template_html,
      device_approval_url,
      allowed_solana_programs,
    } = body

    const updates: Record<string, any> = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 })
      }
      updates.name = name.trim()
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null
    }

    if (auth0_domain !== undefined) updates.auth0_domain = auth0_domain || null
    if (auth0_client_id !== undefined) updates.auth0_client_id = auth0_client_id || null
    if (auth0_client_secret !== undefined) {
      // TODO: Encrypt before storing
      updates.auth0_client_secret_encrypted = auth0_client_secret || null
    }
    if (callback_urls !== undefined) updates.callback_urls = callback_urls || null
    if (allowed_logout_urls !== undefined) updates.allowed_logout_urls = allowed_logout_urls || null
    if (allowed_web_origins !== undefined) updates.allowed_web_origins = allowed_web_origins || null
    if (logo_url !== undefined) updates.logo_url = logo_url || null
    if (website_url !== undefined) updates.website_url = website_url || null
    if (is_active !== undefined) updates.is_active = Boolean(is_active)
    if (email_reply_to !== undefined) updates.email_reply_to = email_reply_to || null
    if (email_from_name !== undefined) updates.email_from_name = email_from_name || null
    if (email_template_html !== undefined) updates.email_template_html = email_template_html || null
    if (email_password_reset_template_html !== undefined) updates.email_password_reset_template_html = email_password_reset_template_html || null
    if (email_magic_link_template_html !== undefined) updates.email_magic_link_template_html = email_magic_link_template_html || null
    if (email_otp_template_html !== undefined) updates.email_otp_template_html = email_otp_template_html || null
    if (email_device_approval_template_html !== undefined) updates.email_device_approval_template_html = email_device_approval_template_html || null
    if (device_approval_url !== undefined) updates.device_approval_url = device_approval_url || null
    if (allowed_solana_programs !== undefined) {
      // Validate it's an array of valid base58 Solana program ids, so a bad input
      // can't silently widen what the relayer will sponsor.
      const list = Array.isArray(allowed_solana_programs) ? allowed_solana_programs : []
      for (const pid of list) {
        if (typeof pid !== 'string' || pid.length < 32 || pid.length > 44) {
          return NextResponse.json(
            { error: `Invalid Solana program id: ${pid}` },
            { status: 400 },
          )
        }
      }
      updates.allowed_solana_programs = list
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: app, error } = await supabase
      .from('apps')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating app:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ app })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/apps/[id] - Delete an app
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First verify ownership
    const { data: existingApp, error: fetchError } = await supabase
      .from('apps')
      .select(`
        id,
        organization:organizations!inner(owner_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingApp) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    const organization = existingApp.organization as unknown as { owner_id: string }
    if (organization.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase.from('apps').delete().eq('id', id)

    if (error) {
      console.error('Error deleting app:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
