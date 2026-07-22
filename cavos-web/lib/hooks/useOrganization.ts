'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'cavos:selected-organization'
const CHANGE_EVENT = 'cavos:organization-change'

export function useOrganization() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [organizationId, setOrganizationIdState] = useState('')
  const [loading, setLoading] = useState(true)

  const setOrganizationId = useCallback((value: string) => {
    setOrganizationIdState(value)
    if (!value) return
    window.localStorage.setItem(STORAGE_KEY, value)
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: value }))
  }, [])

  useEffect(() => {
    fetch('/api/organizations')
      .then((response) => response.json())
      .then((data) => {
        const items = data.organizations ?? []
        setOrganizations(items)
        const stored = window.localStorage.getItem(STORAGE_KEY)
        const initial = items.some((item: any) => item.id === stored) ? stored! : (items[0]?.id ?? '')
        setOrganizationIdState(initial)
        if (initial) window.localStorage.setItem(STORAGE_KEY, initial)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const sync = (event: Event) => setOrganizationIdState((event as CustomEvent<string>).detail)
    window.addEventListener(CHANGE_EVENT, sync)
    return () => window.removeEventListener(CHANGE_EVENT, sync)
  }, [])

  return { organizations, organizationId, setOrganizationId, loading }
}
