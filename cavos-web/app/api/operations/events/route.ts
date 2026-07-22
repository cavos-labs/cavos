import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized', request_id: requestId }, { status: 401 })
  const params = new URL(request.url).searchParams
  const limit = Math.min(Number(params.get('limit') ?? 50), 100)
  let query = supabase.from('cavos_events').select('id,event_type,status,severity,network,request_id,tx_reference,duration_ms,error_code,metadata,created_at,app_id,environment_id,wallet_id').order('created_at', { ascending: false }).limit(limit)
  for (const key of ['app_id', 'environment_id', 'network', 'status'] as const) {
    const value = params.get(key)
    if (value) query = query.eq(key, value)
  }
  const search = params.get('search')?.trim()
  if (search) query = query.or(`request_id.ilike.%${search.replace(/[%_,()]/g, '')}%,tx_reference.ilike.%${search.replace(/[%_,()]/g, '')}%`)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Could not load events', request_id: requestId }, { status: 500 })
  return NextResponse.json({ events: data ?? [], request_id: requestId })
}
