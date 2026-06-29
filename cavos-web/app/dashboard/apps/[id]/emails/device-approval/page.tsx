'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .header { text-align: center; margin-bottom: 32px; }
      .logo { width: 64px; height: 64px; border-radius: 12px; margin: 0 auto; }
      .content { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 32px; }
      h1 { font-size: 24px; font-weight: 600; margin: 0 0 16px 0; color: #000000; }
      p { font-size: 16px; line-height: 24px; color: #737373; margin: 0 0 16px 0; }
      .button { display: inline-block; background: #000000; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 24px 0; font-weight: 500; }
      .notice { margin: 24px 0 0; padding: 14px 16px; background: #f8f8f8; border-radius: 8px; font-size: 14px; color: #888888; line-height: 20px; }
      .footer { margin-top: 32px; text-align: center; font-size: 14px; color: #a3a3a3; }
      .small-text { font-size: 14px; color: #a3a3a3; line-height: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="{{app_logo}}" alt="{{app_name}}" class="logo" />
      </div>
      <div class="content">
        <h1>Approve a new device</h1>
        <p>Someone is trying to access your {{app_name}} wallet from <strong>{{device_name}}</strong>. For your security, approve this device from a device you've already signed in on.</p>
        <div style="text-align: center;">
          <a href="{{device_approval_url}}" class="button">Approve device</a>
        </div>
        <div class="notice">
          Open this link on a device that already has access to your wallet.
        </div>
        <p class="small-text" style="margin-top: 16px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      <div class="footer">
        <p>Secured by <a href="https://cavos.xyz" style="color: #a3a3a3;">Cavos</a></p>
        <p>&copy; 2026 {{app_name}}. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`

const PLACEHOLDERS = [
  { key: '{{device_approval_url}}', label: 'device_approval_url', description: 'One-tap approval link' },
  { key: '{{device_name}}', label: 'device_name', description: 'New device label (browser/device)' },
  { key: '{{app_name}}', label: 'app_name', description: 'Your application name' },
  { key: '{{user_email}}', label: 'user_email', description: "Recipient's email address" },
  { key: '{{app_logo}}', label: 'app_logo', description: 'App logo image URL' },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/30 mb-3">
      {children}
    </p>
  )
}

export default function DeviceApprovalEmailPage() {
  const router = useRouter()
  const params = useParams()
  const appId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const [app, setApp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<'saved' | 'error' | null>(null)
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code')
  const [copied, setCopied] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    email_reply_to: '',
    email_from_name: '',
    device_approval_url: '',
    email_device_approval_template_html: '',
  })

  useEffect(() => {
    if (!appId) return

    const fetchApp = async () => {
      try {
        const res = await fetch(`/api/apps/${appId}`)
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch app')
        }

        const data = await res.json()
        setApp(data.app)
        setFormData({
          name: data.app.name || '',
          logo_url: data.app.logo_url || '',
          email_reply_to: data.app.email_reply_to || '',
          email_from_name: data.app.email_from_name || '',
          device_approval_url: data.app.device_approval_url || '',
          email_device_approval_template_html: data.app.email_device_approval_template_html || DEFAULT_TEMPLATE,
        })
      } catch {
        setError('Failed to load application')
      } finally {
        setLoading(false)
      }
    }

    fetchApp()
  }, [appId, router])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    const ext = file.name.split('.').pop()
    const path = `${Math.random().toString(36).substring(2)}.${ext}`
    setUploading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: uploadError } = await supabase.storage.from('app-icons').upload(path, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('app-icons').getPublicUrl(path)
      setFormData(prev => ({ ...prev, logo_url: publicUrl }))
    } catch {
      setError('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setToast(null)

    try {
      const templateToSave = formData.email_device_approval_template_html === DEFAULT_TEMPLATE ? '' : formData.email_device_approval_template_html
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          logo_url: formData.logo_url,
          email_reply_to: formData.email_reply_to,
          email_from_name: formData.email_from_name,
          device_approval_url: formData.device_approval_url,
          email_device_approval_template_html: templateToSave,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      setToast('saved')
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setError(err.message)
      setToast('error')
    } finally {
      setSaving(false)
    }
  }

  const insertPlaceholder = useCallback((placeholder: string) => {
    const el = editorRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const value = formData.email_device_approval_template_html
    const next = value.substring(0, start) + placeholder + value.substring(end)
    setFormData(prev => ({ ...prev, email_device_approval_template_html: next }))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + placeholder.length, start + placeholder.length)
    })
  }, [formData.email_device_approval_template_html])

  const copyPlaceholder = useCallback((key: string) => {
    navigator.clipboard.writeText(key)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }, [])

  const previewHtml = useMemo(() => {
    const base = formData.device_approval_url ? `${formData.device_approval_url.replace(/\/$/, '')}/approve-device?request=EXAMPLE` : 'https://your-app.com/approve-device?request=EXAMPLE'
    return (formData.email_device_approval_template_html || DEFAULT_TEMPLATE)
      .replace(/\{\{device_approval_url\}\}/g, base)
      .replace(/\{\{device_name\}\}/g, 'Chrome on Mac')
      .replace(/\{\{app_name\}\}/g, formData.name || 'Your App')
      .replace(/\{\{user_email\}\}/g, 'user@example.com')
      .replace(/\{\{app_logo\}\}/g, formData.logo_url || 'https://placehold.co/64x64/f5f5f5/999?text=Logo')
  }, [formData.email_device_approval_template_html, formData.device_approval_url, formData.name, formData.logo_url])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Icon.Spinner className="w-7 h-7 animate-spin text-black/20" />
      </div>
    )
  }

  if (error && !app) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
          <Icon.Warning className="w-5 h-5 text-red-400" />
        </div>
        <p className="text-sm text-black/60 mb-4">{error}</p>
        <Link href="/dashboard/apps">
          <Button variant="outline" size="sm">Back to apps</Button>
        </Link>
      </div>
    )
  }

  const lineCount = formData.email_device_approval_template_html.split('\n').length
  const charCount = formData.email_device_approval_template_html.length

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/apps/${appId}`} className="inline-flex items-center gap-1.5 text-sm text-black/40 hover:text-black/80 transition-colors group">
          <Icon.ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          {app?.name || 'App'}
        </Link>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-line text-[10px] font-semibold uppercase tracking-widest text-black/40">
          <Icon.Shield className="w-2.5 h-2.5" />
          Multi-Device
        </div>
      </div>

      <div data-dash-header>
        <h1 className="text-xl font-semibold tracking-tight text-ink mb-1">Device Approval</h1>
        <p className="text-sm text-black/40">Customize the email users receive when a new device requests access to their wallet, and where to send them to approve it.</p>
      </div>

      <div data-dash-panel className="grid gap-4" style={{ gridTemplateColumns: '320px 1fr', height: 'calc(100vh - 290px)', minHeight: '520px' }}>
        <div className="flex flex-col bg-white border border-line rounded-2xl overflow-hidden">
          <div className="overflow-y-auto flex-1 p-5 space-y-6">
            <div>
              <SectionLabel>App info</SectionLabel>
              <div className="space-y-4">
                <Input label="App Name" placeholder="My App" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                <div>
                  <label className="block text-sm font-medium text-black/80 mb-2">App Logo</label>
                  <div className="flex items-center gap-3">
                    <div onClick={() => fileInputRef.current?.click()} className="relative w-14 h-14 rounded-xl border flex items-center justify-center cursor-pointer overflow-hidden transition-all group shrink-0 border-dashed border-black/15 bg-surface hover:bg-black/[0.04]">
                      {formData.logo_url ? (
                        <>
                          <Image src={formData.logo_url} alt="Logo" width={56} height={56} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Icon.Upload className="w-4 h-4 text-white" />
                          </div>
                        </>
                      ) : uploading ? <Icon.Spinner className="w-4 h-4 text-black/30 animate-spin" /> : <Icon.Image className="w-4 h-4 text-black/20" />}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                    <div className="flex-1 min-w-0">
                      <input type="url" placeholder="https://.../logo.png" value={formData.logo_url} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} className="w-full text-xs px-3 py-2 bg-surface border border-line rounded-lg focus:outline-none focus:border-black/30 text-black/70 placeholder:text-black/25" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-line" />

            <div>
              <SectionLabel>Approval destination</SectionLabel>
              <Input label="App URL (for approval)" placeholder="https://your-app.com" value={formData.device_approval_url} onChange={e => setFormData({ ...formData, device_approval_url: e.target.value })} />
              <p className="text-[11px] text-black/35 mt-1.5">
                <span className="font-medium text-black/50">Required.</span> When a new device signs in, we email a link to <code className="font-mono">{'{this URL}/approve-device?request=...'}</code>. You must build this page in your app — it signs <code className="font-mono">add_signer</code> using <span className="font-medium text-black/50">your own paymaster API key</span>. See the Multi-device docs for a reference implementation.
              </p>
            </div>

            <div className="border-t border-line" />

            <div>
              <SectionLabel>Sender</SectionLabel>
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-line rounded-lg">
                  <Icon.Mail className="w-3 h-3 text-black/30 shrink-0" />
                  <span className="text-[11px] text-black/40 font-mono">noreply@cavos.xyz</span>
                </div>
                <Input label="Sender Name" placeholder={formData.name || 'Your App'} value={formData.email_from_name} onChange={e => setFormData({ ...formData, email_from_name: e.target.value })} />
                <Input label="Reply-To (optional)" placeholder="support@yourdomain.com" type="email" value={formData.email_reply_to} onChange={e => setFormData({ ...formData, email_reply_to: e.target.value })} />
              </div>
            </div>

            <div className="border-t border-line" />

            <div>
              <SectionLabel>Placeholders</SectionLabel>
              <div className="space-y-1.5">
                {PLACEHOLDERS.map(({ key, label, description }) => (
                  <div key={key} className="group flex items-center gap-2 px-3 py-2.5 rounded-xl border border-line bg-surface hover:bg-white hover:border-line-strong hover:shadow-sm transition-all cursor-pointer" onClick={() => insertPlaceholder(key)}>
                    <div className="flex-1 min-w-0">
                      <code className="text-[11px] font-mono text-ink block truncate">{`{{${label}}}`}</code>
                      <span className="text-[10px] text-black/35">{description}</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); copyPlaceholder(key) }} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/5" title="Copy">
                      {copied === key ? <Icon.CheckCircle className="w-3 h-3 text-green-500" /> : <Icon.Copy className="w-3 h-3 text-black/30" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl overflow-hidden border border-line bg-ink">
          <div className="flex items-center border-b border-white/[0.06] shrink-0">
            {(['code', 'preview'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-xs font-medium transition-colors capitalize ${activeTab === tab ? 'text-white border-b border-white/40 -mb-px' : 'text-white/30 hover:text-white/60'}`}>
                {tab === 'code' ? 'HTML Editor' : 'Preview'}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-3 pr-4">
              <span className="text-[10px] font-mono text-white/20">{lineCount}L - {charCount}ch</span>
              <button onClick={() => setFormData(prev => ({ ...prev, email_device_approval_template_html: DEFAULT_TEMPLATE }))} title="Reset to default" className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 transition-colors">
                <Icon.Refresh className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          {activeTab === 'code' ? (
            <textarea ref={editorRef} value={formData.email_device_approval_template_html} onChange={e => setFormData(prev => ({ ...prev, email_device_approval_template_html: e.target.value }))} spellCheck={false} className="flex-1 w-full bg-transparent text-[#d4cfc8] font-mono text-xs leading-6 p-5 resize-none focus:outline-none" style={{ caretColor: '#402AFF' }} placeholder="Paste your HTML template here..." />
          ) : (
            <iframe srcDoc={previewHtml} className="flex-1 w-full bg-white" title="Email Preview" sandbox="allow-same-origin" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 h-8">
          {toast === 'saved' && <div className="flex items-center gap-1.5 text-xs text-green-600"><Icon.CheckCircle className="w-3.5 h-3.5" />Saved</div>}
          {toast === 'error' && <div className="flex items-center gap-1.5 text-xs text-red-500"><Icon.Warning className="w-3.5 h-3.5" />{error}</div>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/apps/${appId}`)}>Cancel</Button>
          <button onClick={handleSave} disabled={saving || uploading} className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold bg-ink text-white hover:bg-black/80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {saving ? <><Icon.Spinner className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <><Icon.Device className="w-3.5 h-3.5" /> Save Settings</>}
          </button>
        </div>
      </div>
    </div>
  )
}
