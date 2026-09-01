'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

export const PROFILE_UPDATED = 'cavos-profile-updated'

type ProfileDraft = {
  full_name: string
  avatar_url: string
  x_url: string
  github_url: string
  website_url: string
}

const emptyDraft: ProfileDraft = {
  full_name: '',
  avatar_url: '',
  x_url: '',
  github_url: '',
  website_url: '',
}

const socials = [
  { key: 'x_url', label: 'X', placeholder: 'https://x.com/you' },
  { key: 'github_url', label: 'GitHub', placeholder: 'https://github.com/you' },
  { key: 'website_url', label: 'Website', placeholder: 'https://' },
] as const

function blankToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function ProfileForm() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: loadError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, x_url, github_url, website_url')
        .eq('id', user.id)
        .maybeSingle()
      if (loadError) setError(loadError.message)
      else if (data) {
        setDraft({
          full_name: data.full_name ?? '',
          avatar_url: data.avatar_url ?? '',
          x_url: data.x_url ?? '',
          github_url: data.github_url ?? '',
          website_url: data.website_url ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    setError('')
    setSaved(false)
    const extension = file.name.split('.').pop() || 'png'
    const path = `avatars/${userId}/${Math.random().toString(36).slice(2)}.${extension}`
    const supabase = createClient()
    const { error: uploadError } = await supabase.storage.from('app-icons').upload(path, file)
    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('app-icons').getPublicUrl(path)
    setDraft((current) => ({ ...current, avatar_url: publicUrl }))
    setUploading(false)
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!userId) return
    setSaving(true)
    setError('')
    setSaved(false)
    const supabase = createClient()
    const { error: saveError } = await supabase
      .from('profiles')
      .update({
        full_name: blankToNull(draft.full_name),
        avatar_url: blankToNull(draft.avatar_url),
        x_url: blankToNull(draft.x_url),
        github_url: blankToNull(draft.github_url),
        website_url: blankToNull(draft.website_url),
      })
      .eq('id', userId)
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    setSaved(true)
    window.dispatchEvent(new Event(PROFILE_UPDATED))
  }

  const glyph = (draft.full_name || '?')[0]?.toUpperCase()

  return (
    <section id="profile" className="rounded-xl border border-line bg-white">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold">Profile</h2>
        <p className="mt-1 text-xs text-black/45">Name, photo, and the socials on your developer account.</p>
      </div>
      {loading ? (
        <p className="px-5 py-6 text-sm text-black/45">Loading profile…</p>
      ) : (
        <form onSubmit={save} className="space-y-5 px-5 py-5">
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !userId}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-line bg-surface"
              aria-label="Change profile photo"
            >
              {draft.avatar_url ? (
                <Image src={draft.avatar_url} alt="" fill className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-ink">{glyph}</span>
              )}
            </button>
            <div>
              <Button type="button" variant="ghost" size="sm" loading={uploading} disabled={!userId} onClick={() => fileInputRef.current?.click()}>
                {draft.avatar_url ? 'Change photo' : 'Add photo'}
              </Button>
              <p className="mt-1 text-xs text-black/45">JPG, PNG, or WebP.</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={upload} />
          </div>
          <Input
            label="Display name"
            value={draft.full_name}
            onChange={(event) => setDraft((current) => ({ ...current, full_name: event.target.value }))}
            placeholder="Your name"
          />
          {socials.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              value={draft[field.key]}
              onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
              placeholder={field.placeholder}
            />
          ))}
          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving} disabled={!userId}>Save profile</Button>
            {saved && <p className="text-xs text-black/45">Saved.</p>}
          </div>
        </form>
      )}
    </section>
  )
}
