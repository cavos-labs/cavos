'use client'

import { useMemo } from 'react'
import { useConsoleData, type ConsoleApp } from '@/lib/hooks/consoleData'

export type { ConsoleApp }

export function useApp() {
  const { apps, organizationId, appId, setAppId, upsertApp, removeApp, loading, appsError } = useConsoleData()
  const visible = useMemo(
    () => apps.filter((app) => app.organization_id === organizationId),
    [apps, organizationId],
  )
  const app = visible.find((item) => item.id === appId) ?? null
  return { apps: visible, app, appId, setAppId, upsertApp, removeApp, loading, error: appsError }
}
