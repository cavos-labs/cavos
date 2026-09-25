'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useOrganization } from '@/lib/hooks/useOrganization'
import { useApp } from '@/lib/hooks/useApp'

export default function DashboardIndexPage() {
  const router = useRouter()
  const { organizations, organizationId, loading: organizationLoading, error: organizationError } = useOrganization()
  const { appId, loading } = useApp()
  // Set when the organization was created a moment ago, in onboarding.
  const [onboarding, setOnboarding] = useState(false)

  useEffect(() => {
    setOnboarding(new URLSearchParams(window.location.search).get('onboarding') === '1')
  }, [])

  const noOrganization = !organizationLoading && !organizationError && organizations.length === 0

  useEffect(() => {
    if (organizationLoading || loading) return
    // Every app belongs to an organization, so a new account starts there.
    if (noOrganization) router.replace('/dashboard/organizations/new?onboarding=1')
    else if (appId) router.replace(`/dashboard/apps/${appId}`)
  }, [appId, loading, organizationLoading, noOrganization, router])

  if (loading || organizationLoading || appId || noOrganization) {
    return <PageSkeleton />
  }

  return (
    <div className="mx-auto max-w-xl pt-6 lg:pt-16">
      {onboarding && <p className="mb-3 text-center text-sm text-muted">Step 2 of 2</p>}
      <EmptyState
        title="Create your first app"
        description="An app holds what your integration runs on: its app ID for CavosProvider, callback URLs, chains, and recovery settings. You can add more apps to this organization later."
        action={
          <Link href={`/dashboard/apps/new${organizationId ? `?organization=${organizationId}` : ''}`}>
            <Button size="sm">Create app</Button>
          </Link>
        }
      />
    </div>
  )
}
