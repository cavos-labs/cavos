'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOrganization } from '@/lib/hooks/useOrganization'

const STORAGE_PREFIX = 'cavos:selected-app'
const CHANGE_EVENT = 'cavos:app-change'

export type ConsoleApp = {
  id: string
  name: string
  logo_url?: string | null
  description?: string | null
}

function storageKey(organizationId: string) {
  return `${STORAGE_PREFIX}:${organizationId}`
}

export function useApp() {
  const { organizationId, loading: organizationLoading } = useOrganization()
  const [apps, setApps] = useState<ConsoleApp[]>([])
  const [appId, setAppIdState] = useState('')
  const [loading, setLoading] = useState(true)

  const setAppId = useCallback((value: string, organization = organizationId) => {
    setAppIdState(value)
    if (!value || !organization) return
    window.localStorage.setItem(storageKey(organization), value)
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { organizationId: organization, appId: value } }))
  }, [organizationId])

  useEffect(() => {
    if (organizationLoading) return
    if (!organizationId) {
      setApps([])
      setAppIdState('')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    fetch(`/api/apps?organization_id=${organizationId}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return
        const items: ConsoleApp[] = data.apps ?? []
        setApps(items)
        const stored = window.localStorage.getItem(storageKey(organizationId))
        const initial = items.some((item) => item.id === stored) ? stored! : (items[0]?.id ?? '')
        setAppIdState(initial)
        if (initial) window.localStorage.setItem(storageKey(organizationId), initial)
      })
      .catch(() => {
        if (cancelled) return
        setApps([])
        setAppIdState('')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [organizationId, organizationLoading])

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ organizationId: string; appId: string }>).detail
      if (detail?.organizationId !== organizationId) return
      setAppIdState(detail.appId)
    }
    window.addEventListener(CHANGE_EVENT, sync)
    return () => window.removeEventListener(CHANGE_EVENT, sync)
  }, [organizationId])

  const app = apps.find((item) => item.id === appId) ?? null

  return { apps, app, appId, setAppId, loading: loading || organizationLoading }
}
