import { NextResponse } from 'next/server'
import { organizationForApp } from '@/lib/operations/access'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await organizationForApp(id)
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { data, error } = await access.supabase.from('app_environments').select('id,public_id,kind,is_active,allowed_origins,low_balance_threshold_usd,created_at,updated_at').eq('app_id', id).order('kind', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ environments: data })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await organizationForApp(id)
  if (!access || !['owner', 'admin', 'developer'].includes(access.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  if (!body.environment_id) return NextResponse.json({ error: 'environment_id is required' }, { status: 400 })
  const updates: Record<string, unknown> = {}
  if (body.allowed_origins !== undefined) updates.allowed_origins = Array.isArray(body.allowed_origins) ? body.allowed_origins : []
  if (body.low_balance_threshold_usd !== undefined) updates.low_balance_threshold_usd = body.low_balance_threshold_usd
  const { data, error } = await access.supabase.from('app_environments').update(updates).eq('id', body.environment_id).eq('app_id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ environment: data })
}
