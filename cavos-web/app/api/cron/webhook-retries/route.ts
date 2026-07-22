import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deliverWebhook } from '@/lib/operations/webhooks'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data: deliveries } = await admin.from('webhook_deliveries').select('id,attempt,webhook_id,event_id').eq('status','failed').not('next_attempt_at','is',null).lte('next_attempt_at',new Date().toISOString()).limit(25)
  let retried = 0
  for (const delivery of deliveries ?? []) {
    const [{ data: webhook }, { data: event }] = await Promise.all([
      admin.from('webhook_endpoints').select('*').eq('id',delivery.webhook_id).eq('is_active',true).maybeSingle(),
      admin.from('cavos_events').select('*').eq('id',delivery.event_id).maybeSingle(),
    ])
    if (!webhook || !event) continue
    await admin.from('webhook_deliveries').update({ next_attempt_at: null }).eq('id', delivery.id)
    await deliverWebhook(webhook,event,delivery.attempt+1)
    retried++
  }
  return NextResponse.json({ retried })
}
