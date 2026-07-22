import { NextResponse } from 'next/server'
import { organizationForApp } from '@/lib/operations/access'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await organizationForApp(id)
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const environmentId = new URL(request.url).searchParams.get('environment_id')
  const { data: app } = await access.supabase.from('apps').select('allowed_web_origins,device_approval_url,email_magic_link_template_html,email_otp_template_html,allowed_solana_programs').eq('id', id).single()
  let eventQuery = access.supabase.from('cavos_events').select('status,severity,created_at').eq('app_id', id).order('created_at', { ascending: false }).limit(25)
  let webhookQuery = access.supabase.from('webhook_endpoints').select('is_active,consecutive_failures').eq('app_id', id)
  if (environmentId) { eventQuery = eventQuery.eq('environment_id', environmentId); webhookQuery = webhookQuery.eq('environment_id', environmentId) }
  const [{ data: events }, { data: webhooks }] = await Promise.all([eventQuery, webhookQuery])
  const checks = [
    { id: 'origins', label: 'Allowed origins', passed: Boolean(app?.allowed_web_origins?.length), href: `/dashboard/apps/${id}/settings` },
    { id: 'device_approval', label: 'Device approval URL', passed: Boolean(app?.device_approval_url), href: `/dashboard/apps/${id}/emails/device-approval` },
    { id: 'email_templates', label: 'Authentication email templates', passed: Boolean(app?.email_magic_link_template_html || app?.email_otp_template_html), href: `/dashboard/apps/${id}/emails` },
    { id: 'programs', label: 'Solana program policy', passed: Boolean(app?.allowed_solana_programs?.length), href: `/dashboard/apps/${id}/programs` },
    { id: 'webhooks', label: 'Webhook delivery health', passed: !webhooks?.some((w) => !w.is_active || w.consecutive_failures > 2), href: '/dashboard/webhooks' },
    { id: 'recent_events', label: 'Recent Cavos event', passed: Boolean(events?.length), href: `/dashboard/apps/${id}/activity` },
    { id: 'critical_errors', label: 'No recent critical errors', passed: !events?.some((e) => e.status === 'failed' && e.severity === 'critical'), href: `/dashboard/apps/${id}/activity` },
  ]
  return NextResponse.json({ checks, passed: checks.filter((check) => check.passed).length, total: checks.length })
}
