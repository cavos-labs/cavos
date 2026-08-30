'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useOrganization } from '@/lib/hooks/useOrganization'
import { useApp } from '@/lib/hooks/useApp'

export default function DashboardIndexPage() {
  const router = useRouter()
  const { organizationId, loading: organizationLoading } = useOrganization()
  const { appId, apps, loading } = useApp()

  useEffect(() => {
    if (loading || organizationLoading) return
    if (appId) router.replace(`/dashboard/apps/${appId}`)
  }, [appId, loading, organizationLoading, router])

  if (loading || organizationLoading || appId) {
    return <PageSkeleton />
  }

  return (
    <EmptyState
      title="No applications yet"
      description="Create an app to open its dashboard — stats, wallets, and configuration live there."
      action={
        <Link href={`/dashboard/apps/new${organizationId ? `?organization_id=${organizationId}` : ''}`}>
          <Button size="sm">Create application</Button>
        </Link>
      }
    />
  )
}
