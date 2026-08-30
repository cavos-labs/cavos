'use client'

import { useEffect } from 'react'
import { useApp } from '@/lib/hooks/useApp'

export function SyncSelectedApp({ id }: { id: string }) {
  const { appId, setAppId, loading } = useApp()

  useEffect(() => {
    if (loading || !id || id === appId) return
    setAppId(id)
  }, [appId, id, loading, setAppId])

  return null
}
