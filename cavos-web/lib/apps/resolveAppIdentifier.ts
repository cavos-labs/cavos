import { createAdminClient } from '@/lib/supabase/admin'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface ResolvedAppIdentifier {
  appId: string
  environmentId: string | null
  environmentKind: 'development' | 'production' | null
}

/**
 * Resolve the identifier exposed to SDK users into the internal app UUID.
 *
 * New dashboard integrations copy an `app_environments.public_id` (`cav_…`).
 * Older integrations still use the UUID from `apps.id`. Both forms remain
 * valid; UUIDs keep their historical production-environment default.
 */
export async function resolveAppIdentifier(
  identifier: string,
  environmentHint?: string | null,
): Promise<ResolvedAppIdentifier | null> {
  const admin = createAdminClient()

  if (UUID_PATTERN.test(identifier)) {
    const { data: app, error: appError } = await admin
      .from('apps')
      .select('id,is_active')
      .eq('id', identifier)
      .maybeSingle()

    if (appError || !app?.is_active) return null

    const { data: environments, error: environmentsError } = await admin
      .from('app_environments')
      .select('id,public_id,kind,is_active')
      .eq('app_id', app.id)
    if (environmentsError) return null

    const environment = environmentHint
      ? environments?.find(
          (candidate) =>
            candidate.id === environmentHint ||
            candidate.public_id === environmentHint ||
            candidate.kind === environmentHint,
        )
      : environments?.find((candidate) => candidate.kind === 'production')

    if (environmentHint && (!environment || !environment.is_active)) return null

    return {
      appId: app.id,
      environmentId: environment?.is_active ? environment.id : null,
      environmentKind: environment?.is_active ? environment.kind : null,
    }
  }

  const { data: environment, error: environmentError } = await admin
    .from('app_environments')
    .select('id,app_id,kind,is_active')
    .eq('public_id', identifier)
    .maybeSingle()

  if (environmentError || !environment?.is_active) return null
  if (
    environmentHint &&
    environmentHint !== environment.id &&
    environmentHint !== identifier &&
    environmentHint !== environment.kind
  ) {
    return null
  }

  const { data: app, error: appError } = await admin
    .from('apps')
    .select('id,is_active')
    .eq('id', environment.app_id)
    .maybeSingle()

  if (appError || !app?.is_active) return null

  return {
    appId: app.id,
    environmentId: environment.id,
    environmentKind: environment.kind,
  }
}
