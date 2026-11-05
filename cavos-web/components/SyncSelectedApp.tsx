'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/hooks/useApp'

export function SyncSelectedApp({ id }: { id: string }) {
  const router = useRouter()
  const { apps, appId, setAppId, adoptApp, hasApp, loading, error } = useApp()
  const adopted = useRef('')

  useEffect(() => {
    if (loading || error || !id) return
    if (apps.some((app) => app.id === id)) {
      adopted.current = id
      if (id !== appId) setAppId(id)
      return
    }
    // A deleted app stays in the URL until we leave it. Adopting that id
    // makes the sidebar navigate back to the same missing page.
    if (!hasApp(id)) {
      router.replace('/dashboard/apps')
      return
    }
    if (adopted.current !== id) {
      adopted.current = id
      adoptApp(id)
    }
  }, [adoptApp, appId, apps, error, hasApp, id, loading, router, setAppId])

  return null
}
