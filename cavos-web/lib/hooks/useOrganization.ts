'use client'

import { useConsoleData, type ConsoleOrganization } from '@/lib/hooks/consoleData'

export type { ConsoleOrganization }

export function useOrganization() {
  const { organizations, organizationId, setOrganizationId, upsertOrganization, loading, error } = useConsoleData()
  return { organizations, organizationId, setOrganizationId, upsertOrganization, loading, error }
}
