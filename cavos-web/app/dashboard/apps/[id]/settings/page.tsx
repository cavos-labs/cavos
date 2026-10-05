'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { AppForm } from '@/components/AppForm'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useApp } from '@/lib/hooks/useApp'

type SettingsApp = {
  id: string
  name: string
  description?: string
  logo_url?: string
  organization_id?: string
  callback_urls?: string[]
  allowed_web_origins?: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readStringList(value: unknown) {
  if (!Array.isArray(value)) return undefined
  return value.filter((item): item is string => typeof item === 'string')
}

function readSettingsApp(value: unknown): SettingsApp | null {
  if (!isRecord(value) || !isRecord(value.app)) return null
  const app = value.app
  if (typeof app.id !== 'string' || typeof app.name !== 'string') return null
  const callbackUrls = readStringList(app.callback_urls)
  const allowedOrigins = readStringList(app.allowed_web_origins)
  return {
    id: app.id,
    name: app.name,
    ...(typeof app.description === 'string' ? { description: app.description } : {}),
    ...(typeof app.logo_url === 'string' ? { logo_url: app.logo_url } : {}),
    ...(typeof app.organization_id === 'string' ? { organization_id: app.organization_id } : {}),
    ...(callbackUrls ? { callback_urls: callbackUrls } : {}),
    ...(allowedOrigins ? { allowed_web_origins: allowedOrigins } : {}),
  }
}

function errorMessage(value: unknown) {
  if (isRecord(value) && typeof value.error === 'string') return value.error
  return 'Could not delete this application.'
}

export default function AppSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { apps, removeApp } = useApp()
  const [app, setApp] = useState<SettingsApp | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/apps/${id}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: unknown) => {
        if (!cancelled) setApp(readSettingsApp(payload))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const listed = apps.find((item) => item.id === id)
  const name = listed?.name ?? app?.name ?? 'this application'

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      const response = await fetch(`/api/apps/${id}`, { method: 'DELETE' })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        setDeleteError(errorMessage(payload))
        setDeleting(false)
        return
      }
      removeApp(id)
      router.push('/dashboard/apps')
    } catch {
      setDeleteError('Could not delete this application.')
      setDeleting(false)
    }
  }

  if (loading) return <PageSkeleton />
  if (!app) return <div role="alert" className="border-l-2 border-red-600 bg-white p-5 text-sm text-red-700">Application could not be loaded.</div>

  return (
    <div className="space-y-6">
      <PageHeader title="App settings" subtitle="Identity and presentation shared by both environments." />
      <div className="rounded-xl border border-line bg-white p-6">
        <AppForm mode="edit" initialData={app} />
      </div>
      <div className="rounded-xl border border-line bg-white p-6">
        <h2 className="text-sm font-semibold">Delete application</h2>
        <p className="mt-1 max-w-prose text-sm text-muted">
          Deletes {name} and the wallets, environments, and activity that belong to it. This cannot be undone.
        </p>
        {deleteError && (
          <p role="alert" className="mt-3 text-sm text-danger">{deleteError}</p>
        )}
        <Button type="button" variant="danger" size="sm" className="mt-4" onClick={() => setConfirming(true)}>
          Delete application
        </Button>
      </div>
      <Modal
        open={confirming}
        onClose={deleting ? undefined : () => setConfirming(false)}
        labelledBy="delete-app-title"
        className="w-full max-w-md rounded-2xl border border-line bg-white p-6"
      >
        <h2 id="delete-app-title" className="text-lg font-semibold">Delete {name}?</h2>
        <p className="mt-2 text-sm text-muted">
          This removes the application and everything stored for it. You cannot restore it.
        </p>
        {deleteError && (
          <p role="alert" className="mt-3 text-sm text-danger">{deleteError}</p>
        )}
        <div className="mt-6 flex gap-2.5">
          <Button type="button" variant="danger" className="flex-1" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
          <Button type="button" variant="outline" className="flex-1" disabled={deleting} onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  )
}
