'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const ORG_STORAGE_KEY = 'cavos:selected-organization'
const APP_STORAGE_PREFIX = 'cavos:selected-app'

export type ConsoleOrganization = {
  id: string
  name: string
  slug?: string
}

export type ConsoleApp = {
  id: string
  name: string
  logo_url?: string | null
  description?: string | null
  organization_id?: string
  organization?: { id: string; name: string; slug?: string } | null
}

type ConsoleData = {
  organizations: ConsoleOrganization[]
  organizationId: string
  setOrganizationId: (value: string) => void
  upsertOrganization: (value: unknown) => string | null
  apps: ConsoleApp[]
  appId: string
  setAppId: (value: string, organization?: string) => void
  upsertApp: (value: unknown) => void
  removeApp: (id: string) => string | null
  loading: boolean
  error: boolean
  appsError: boolean
}

const ConsoleDataContext = createContext<ConsoleData | null>(null)

function appStorageKey(organizationId: string) {
  return `${APP_STORAGE_PREFIX}:${organizationId}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readOrganization(value: unknown): ConsoleOrganization | null {
  const record = isRecord(value) && isRecord(value.organization) ? value.organization : value
  if (!isRecord(record) || typeof record.id !== 'string' || typeof record.name !== 'string') return null
  return {
    id: record.id,
    name: record.name,
    ...(typeof record.slug === 'string' ? { slug: record.slug } : {}),
  }
}

function readOrganizationList(value: unknown): ConsoleOrganization[] {
  if (!isRecord(value) || !Array.isArray(value.organizations)) return []
  return value.organizations.flatMap((item) => {
    const organization = readOrganization(item)
    return organization ? [organization] : []
  })
}

function readOrganizationRef(value: unknown): ConsoleApp['organization'] {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') return null
  return {
    id: value.id,
    name: value.name,
    ...(typeof value.slug === 'string' ? { slug: value.slug } : {}),
  }
}

function readApp(value: unknown): ConsoleApp | null {
  const record = isRecord(value) && isRecord(value.app) ? value.app : value
  if (!isRecord(record) || typeof record.id !== 'string' || typeof record.name !== 'string') return null
  return {
    id: record.id,
    name: record.name,
    logo_url: typeof record.logo_url === 'string' ? record.logo_url : null,
    description: typeof record.description === 'string' ? record.description : null,
    ...(typeof record.organization_id === 'string' ? { organization_id: record.organization_id } : {}),
    organization: readOrganizationRef(record.organization),
  }
}

function readAppList(value: unknown): ConsoleApp[] {
  if (!isRecord(value) || !Array.isArray(value.apps)) return []
  return value.apps.flatMap((item) => {
    const app = readApp(item)
    return app ? [app] : []
  })
}

function pickAppId(organizationId: string, apps: ConsoleApp[]) {
  if (!organizationId) return ''
  const orgApps = apps.filter((app) => app.organization_id === organizationId)
  const stored = window.localStorage.getItem(appStorageKey(organizationId))
  const initial = stored && orgApps.some((app) => app.id === stored) ? stored : (orgApps[0]?.id ?? '')
  if (initial) window.localStorage.setItem(appStorageKey(organizationId), initial)
  else window.localStorage.removeItem(appStorageKey(organizationId))
  return initial
}

function withOrganization(app: ConsoleApp, organizations: ConsoleOrganization[], previous?: ConsoleApp): ConsoleApp {
  const organizationId = app.organization_id ?? previous?.organization_id
  const fromList = organizations.find((organization) => organization.id === organizationId)
  const organization = app.organization
    ?? (previous?.organization && previous.organization_id === organizationId ? previous.organization : null)
    ?? (fromList ? { id: fromList.id, name: fromList.name, ...(fromList.slug ? { slug: fromList.slug } : {}) } : null)
  return {
    ...previous,
    ...app,
    ...(organizationId ? { organization_id: organizationId } : {}),
    organization,
  }
}

export function ConsoleDataProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<ConsoleOrganization[]>([])
  const [organizationId, setOrganizationIdState] = useState('')
  const [apps, setApps] = useState<ConsoleApp[]>([])
  const [appId, setAppIdState] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [appsError, setAppsError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [organizationsResult, appsResult] = await Promise.allSettled([
        fetch('/api/organizations').then(async (response) => {
          if (!response.ok) throw new Error(`organizations: ${response.status}`)
          return readOrganizationList(await response.json())
        }),
        fetch('/api/apps').then(async (response) => {
          if (!response.ok) throw new Error(`apps: ${response.status}`)
          return readAppList(await response.json())
        }),
      ])
      if (cancelled) return

      const nextOrganizations = organizationsResult.status === 'fulfilled' ? organizationsResult.value : []
      const nextApps = appsResult.status === 'fulfilled' ? appsResult.value : []
      const storedOrganization = window.localStorage.getItem(ORG_STORAGE_KEY)
      const nextOrganizationId = storedOrganization && nextOrganizations.some((organization) => organization.id === storedOrganization)
        ? storedOrganization
        : (nextOrganizations[0]?.id ?? '')

      setError(organizationsResult.status === 'rejected')
      setAppsError(appsResult.status === 'rejected')
      setOrganizations(nextOrganizations)
      setApps(nextApps)
      setOrganizationIdState(nextOrganizationId)
      if (nextOrganizationId) window.localStorage.setItem(ORG_STORAGE_KEY, nextOrganizationId)
      setAppIdState(pickAppId(nextOrganizationId, nextApps))
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const setOrganizationId = useCallback((value: string) => {
    setOrganizationIdState(value)
    if (!value) return
    window.localStorage.setItem(ORG_STORAGE_KEY, value)
    setAppIdState(pickAppId(value, apps))
  }, [apps])

  const setAppId = useCallback((value: string, organization = organizationId) => {
    setAppIdState(value)
    if (!value || !organization) return
    window.localStorage.setItem(appStorageKey(organization), value)
  }, [organizationId])

  const upsertOrganization = useCallback((value: unknown) => {
    const organization = readOrganization(value)
    if (!organization) return null
    setOrganizations((current) => (
      current.some((item) => item.id === organization.id)
        ? current.map((item) => item.id === organization.id ? organization : item)
        : [organization, ...current]
    ))
    return organization.id
  }, [])

  const upsertApp = useCallback((value: unknown) => {
    const app = readApp(value)
    if (!app) return
    setApps((current) => {
      const index = current.findIndex((item) => item.id === app.id)
      const nextApp = withOrganization(app, organizations, index === -1 ? undefined : current[index])
      if (index === -1) return [nextApp, ...current]
      return current.map((item, itemIndex) => itemIndex === index ? nextApp : item)
    })
  }, [organizations])

  const removeApp = useCallback((id: string) => {
    const removed = apps.find((app) => app.id === id)
    const orgId = removed?.organization_id || organizationId
    const next = appId === id
      ? (apps.find((app) => app.id !== id && app.organization_id === orgId)?.id ?? '')
      : appId
    setApps((current) => current.filter((app) => app.id !== id))
    if (appId === id) {
      setAppIdState(next)
      if (orgId) {
        if (next) window.localStorage.setItem(appStorageKey(orgId), next)
        else window.localStorage.removeItem(appStorageKey(orgId))
      }
    }
    return next || null
  }, [appId, apps, organizationId])

  const value = useMemo(() => ({
    organizations,
    organizationId,
    setOrganizationId,
    upsertOrganization,
    apps,
    appId,
    setAppId,
    upsertApp,
    removeApp,
    loading,
    error,
    appsError,
  }), [appId, apps, appsError, error, loading, organizationId, organizations, removeApp, setAppId, setOrganizationId, upsertApp, upsertOrganization])

  return <ConsoleDataContext.Provider value={value}>{children}</ConsoleDataContext.Provider>
}

export function useConsoleData() {
  const value = useContext(ConsoleDataContext)
  if (!value) throw new Error('Dashboard data hooks must be used inside the dashboard layout')
  return value
}
