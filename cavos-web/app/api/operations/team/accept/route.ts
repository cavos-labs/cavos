import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Invitation token is required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .rpc('inspect_organization_invitation', { p_token_hash: hashToken(token) })
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Unable to inspect invitation' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Invitation is invalid or expired' }, { status: 404 })

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { token } = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !token) return NextResponse.json({ error: 'Authentication and token are required' }, { status: 401 })
  const admin = createAdminClient()
  const { data: invite } = await admin.from('organization_invitations').select('*').eq('token_hash', hashToken(token)).is('accepted_at', null).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!invite || user.email?.toLowerCase() !== invite.email.toLowerCase()) return NextResponse.json({ error: 'Invitation is invalid, expired, or belongs to another email' }, { status: 403 })
  await admin.from('organization_members').upsert({ organization_id: invite.organization_id, user_id: user.id, role: invite.role })
  await admin.from('organization_invitations').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id)
  await admin.from('audit_events').insert({ organization_id: invite.organization_id, actor_id: user.id, action: 'member.joined', resource_type: 'membership', resource_id: user.id, result: 'success', changes: { role: invite.role } })
  return NextResponse.json({ success: true })
}
