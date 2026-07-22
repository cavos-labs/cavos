import { createClient } from '@/lib/supabase/server'

export type OrgRole = 'owner' | 'admin' | 'developer' | 'support' | 'billing' | 'viewer'

export async function requireOrganizationAccess(organizationId: string, allowed?: OrgRole[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401, user: null, role: null, supabase }

  const { data: org } = await supabase.from('organizations').select('id, owner_id').eq('id', organizationId).maybeSingle()
  let role: OrgRole | null = org?.owner_id === user.id ? 'owner' : null
  if (!role) {
    const { data: member } = await supabase.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', user.id).maybeSingle()
    role = member?.role as OrgRole | null
  }
  if (!role) return { ok: false as const, status: 403, user, role: null, supabase }
  if (allowed && !allowed.includes(role)) return { ok: false as const, status: 403, user, role, supabase }
  return { ok: true as const, status: 200, user, role, supabase }
}

export async function organizationForApp(appId: string) {
  const supabase = await createClient()
  const { data: app } = await supabase.from('apps').select('id, organization_id').eq('id', appId).maybeSingle()
  if (!app) return null
  const access = await requireOrganizationAccess(app.organization_id)
  return access.ok ? { app, ...access } : null
}

export function canRevealIdentity(role: OrgRole) {
  return ['owner', 'admin', 'developer'].includes(role)
}
