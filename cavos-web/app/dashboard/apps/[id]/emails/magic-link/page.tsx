'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
    ArrowLeft, Loader2, Mail, Upload, ImageIcon,
    CheckCircle2, AlertCircle, RotateCcw, Zap, Copy
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Default Template ────────────────────────────────────────────────────────

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        margin: 0; padding: 0; background-color: #f5f5f5;
      }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .header { text-align: center; margin-bottom: 32px; }
      .logo { width: 64px; height: 64px; border-radius: 12px; margin: 0 auto; }
      .content {
        background: #ffffff; border: 1px solid #e5e5e5;
        border-radius: 12px; padding: 32px;
      }
      h1 { font-size: 24px; font-weight: 600; margin: 0 0 16px 0; color: #000000; }
      p { font-size: 16px; line-height: 24px; color: #737373; margin: 0 0 16px 0; }
      .button {
        display: inline-block; background: #000000; color: #ffffff !important;
        padding: 12px 24px; border-radius: 8px; text-decoration: none;
        font-weight: 500; margin: 8px 0;
      }
      .notice {
        margin: 24px 0 0; padding: 14px 16px; background: #f8f8f8;
        border-radius: 8px; font-size: 14px; color: #888888; line-height: 20px;
      }
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
        <h1>Sign in to {{app_name}}</h1>
        <p>Click the button below to sign in. No password needed — this link works once and expires in 1 hour.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="{{magic_link}}" class="button">Sign in to {{app_name}}</a>
        </p>
        <div class="notice">
          <strong>Open this link on the same device and browser</strong> where you started signing in.
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

// ─── Placeholders ─────────────────────────────────────────────────────────────

const PLACEHOLDERS: { key: string; label: string; description: string }[] = [
    { key: '{{magic_link}}',  label: 'magic_link',  description: 'One-time sign-in URL' },
    { key: '{{app_name}}',    label: 'app_name',    description: 'Your application name' },
    { key: '{{user_email}}',  label: 'user_email',  description: "Recipient's email address" },
    { key: '{{app_logo}}',    label: 'app_logo',    description: 'App logo image URL' },
]

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/30 mb-3">
            {children}
        </p>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MagicLinkEmailPage() {
    const router  = useRouter()
    const params  = useParams()
    const appId   = params.id as string
    const fileInputRef = useRef<HTMLInputElement>(null)
    const editorRef    = useRef<HTMLTextAreaElement>(null)

    const [app,       setApp]       = useState<any>(null)
    const [loading,   setLoading]   = useState(true)
    const [saving,    setSaving]    = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error,     setError]     = useState('')
    const [toast,     setToast]     = useState<'saved' | 'error' | null>(null)
    const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code')
    const [copied,    setCopied]    = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name:                          '',
        logo_url:                      '',
        email_reply_to:                '',
        email_from_name:               '',
        email_magic_link_template_html: '',
    })

    useEffect(() => { if (appId) fetchApp() }, [appId])

    const fetchApp = async () => {
        try {
            const res = await fetch(`/api/apps/${appId}`)
            if (!res.ok) {
                if (res.status === 401) { router.push('/login'); return }
                throw new Error('Failed to fetch app')
            }
            const data = await res.json()
            setApp(data.app)
            setFormData({
                name:                          data.app.name                          || '',
                logo_url:                      data.app.logo_url                      || '',
                email_reply_to:                data.app.email_reply_to                || '',
                email_from_name:               data.app.email_from_name               || '',
                email_magic_link_template_html: data.app.email_magic_link_template_html || DEFAULT_TEMPLATE,
            })
        } catch {
            setError('Failed to load application')
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        const file    = e.target.files[0]
        const ext     = file.name.split('.').pop()
        const path    = `${Math.random().toString(36).substring(2)}.${ext}`
        setUploading(true); setError('')
        try {
            const supabase = createClient()
            const { error: upErr } = await supabase.storage.from('app-icons').upload(path, file)
            if (upErr) throw upErr
            const { data: { publicUrl } } = supabase.storage.from('app-icons').getPublicUrl(path)
            setFormData(prev => ({ ...prev, logo_url: publicUrl }))
        } catch { setError('Failed to upload image') }
        finally  { setUploading(false) }
    }

    const handleSave = async () => {
        setSaving(true); setError(''); setToast(null)
        try {
            const templateToSave =
                formData.email_magic_link_template_html === DEFAULT_TEMPLATE
                    ? '' : formData.email_magic_link_template_html

            const res = await fetch(`/api/apps/${appId}`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name:                          formData.name,
                    logo_url:                      formData.logo_url,
                    email_reply_to:                formData.email_reply_to,
                    email_from_name:               formData.email_from_name,
                    email_magic_link_template_html: templateToSave,
                }),
            })
            if (!res.ok) {
                const d = await res.json()
                throw new Error(d.error || 'Failed to save')
            }
            setToast('saved')
            setTimeout(() => setToast(null), 3000)
        } catch (err: any) {
            setError(err.message)
            setToast('error')
        } finally { setSaving(false) }
    }

    // Insert placeholder at cursor
    const insertPlaceholder = useCallback((placeholder: string) => {
        const el = editorRef.current
        if (!el) return
        const start = el.selectionStart
        const end   = el.selectionEnd
        const val   = formData.email_magic_link_template_html
        const next  = val.substring(0, start) + placeholder + val.substring(end)
        setFormData(prev => ({ ...prev, email_magic_link_template_html: next }))
        requestAnimationFrame(() => {
            el.focus()
            el.setSelectionRange(start + placeholder.length, start + placeholder.length)
        })
    }, [formData.email_magic_link_template_html])

    const copyPlaceholder = useCallback((key: string) => {
        navigator.clipboard.writeText(key)
        setCopied(key)
        setTimeout(() => setCopied(null), 1500)
    }, [])

    const previewHtml = useMemo(() => {
        return (formData.email_magic_link_template_html || DEFAULT_TEMPLATE)
            .replace(/\{\{magic_link\}\}/g,  '#preview-magic-link')
            .replace(/\{\{app_name\}\}/g,    formData.name || 'Your App')
            .replace(/\{\{user_email\}\}/g,  'user@example.com')
            .replace(/\{\{app_logo\}\}/g,    formData.logo_url || 'https://placehold.co/64x64/f5f5f5/999?text=Logo')
    }, [formData.email_magic_link_template_html, formData.name, formData.logo_url])

    const lineCount  = formData.email_magic_link_template_html.split('\n').length
    const charCount  = formData.email_magic_link_template_html.length

    // ── Loading / error ──────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-7 h-7 animate-spin text-black/20" />
            </div>
        )
    }

    if (error && !app) {
        return (
            <div className="max-w-md mx-auto mt-16 text-center">
                <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-sm text-black/60 mb-4">{error}</p>
                <Link href="/dashboard/apps">
                    <Button variant="outline" size="sm">Back to apps</Button>
                </Link>
            </div>
        )
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-5 pb-4">

            {/* ── Breadcrumb ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <Link
                    href={`/dashboard/apps/${appId}`}
                    className="inline-flex items-center gap-1.5 text-sm text-black/40 hover:text-black/80 transition-colors group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    {app?.name || 'App'}
                </Link>

                {/* Passwordless badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F7F5F2] border border-[#EAE5DC] text-[10px] font-semibold uppercase tracking-widest text-black/40">
                    <Zap className="w-2.5 h-2.5" />
                    Passwordless
                </div>
            </div>

            {/* ── Page header ─────────────────────────────────────────────── */}
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-[#0A0908] mb-1">
                    Magic Link Email
                </h1>
                <p className="text-sm text-black/40">
                    Customize the sign-in email your users receive. Click any placeholder to insert it at the cursor.
                </p>
            </div>

            {/* ── Two-pane workspace ──────────────────────────────────────── */}
            <div
                className="grid gap-4"
                style={{
                    gridTemplateColumns: '320px 1fr',
                    height: 'calc(100vh - 290px)',
                    minHeight: '520px',
                }}
            >
                {/* ── Left: Settings panel ──────────────────────────────── */}
                <div className="flex flex-col gap-0 bg-white border border-[#EAE5DC] rounded-2xl overflow-hidden">
                    <div className="overflow-y-auto flex-1 p-5 space-y-6">

                        {/* App info */}
                        <div>
                            <SectionLabel>App info</SectionLabel>
                            <div className="space-y-4">
                                <Input
                                    label="App Name"
                                    placeholder="My App"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />

                                {/* Logo */}
                                <div>
                                    <label className="block text-sm font-medium text-black/80 mb-2">App Logo</label>
                                    <div className="flex items-center gap-3">
                                        {/* Preview box */}
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`
                                                relative w-14 h-14 rounded-xl border flex items-center justify-center cursor-pointer
                                                overflow-hidden transition-all group shrink-0
                                                ${formData.logo_url
                                                    ? 'border-black/10 bg-white'
                                                    : 'border-dashed border-black/15 bg-[#F7F5F2] hover:bg-[#EAE5DC]'
                                                }
                                            `}
                                        >
                                            {formData.logo_url ? (
                                                <>
                                                    <Image
                                                        src={formData.logo_url}
                                                        alt="Logo"
                                                        width={56} height={56}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Upload className="w-4 h-4 text-white" />
                                                    </div>
                                                </>
                                            ) : (
                                                uploading
                                                    ? <Loader2 className="w-4 h-4 text-black/30 animate-spin" />
                                                    : <ImageIcon className="w-4 h-4 text-black/20" />
                                            )}
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

                                        {/* URL input */}
                                        <div className="flex-1 min-w-0">
                                            <input
                                                type="url"
                                                placeholder="https://…/logo.png"
                                                value={formData.logo_url}
                                                onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                                                className="w-full text-xs px-3 py-2 bg-[#F7F5F2] border border-[#EAE5DC] rounded-lg focus:outline-none focus:border-black/30 text-black/70 placeholder:text-black/25"
                                            />
                                            {formData.logo_url && (
                                                <button
                                                    onClick={() => setFormData({ ...formData, logo_url: '' })}
                                                    className="text-[10px] text-red-400 hover:text-red-600 mt-1 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="border-t border-[#EAE5DC]" />

                        {/* Sender config */}
                        <div>
                            <SectionLabel>Sender</SectionLabel>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 px-3 py-2 bg-[#F7F5F2] border border-[#EAE5DC] rounded-lg">
                                    <Mail className="w-3 h-3 text-black/30 shrink-0" />
                                    <span className="text-[11px] text-black/40 font-mono">noreply@cavos.xyz</span>
                                </div>
                                <Input
                                    label="Sender Name"
                                    placeholder={formData.name || 'Your App'}
                                    value={formData.email_from_name}
                                    onChange={e => setFormData({ ...formData, email_from_name: e.target.value })}
                                />
                                <Input
                                    label="Reply-To (optional)"
                                    placeholder="support@yourdomain.com"
                                    type="email"
                                    value={formData.email_reply_to}
                                    onChange={e => setFormData({ ...formData, email_reply_to: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="border-t border-[#EAE5DC]" />

                        {/* Placeholder chips */}
                        <div>
                            <SectionLabel>Placeholders</SectionLabel>
                            <p className="text-[11px] text-black/35 mb-3 leading-relaxed">
                                Click to insert at cursor, or copy to clipboard.
                            </p>
                            <div className="space-y-1.5">
                                {PLACEHOLDERS.map(({ key, label, description }) => (
                                    <div
                                        key={key}
                                        className="group flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#EAE5DC] bg-[#F7F5F2] hover:bg-white hover:border-[#C4BFB6] hover:shadow-sm transition-all cursor-pointer"
                                        onClick={() => insertPlaceholder(key)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <code className="text-[11px] font-mono text-[#0A0908] block truncate">
                                                {`{{${label}}}`}
                                            </code>
                                            <span className="text-[10px] text-black/35">{description}</span>
                                        </div>
                                        <button
                                            onClick={e => { e.stopPropagation(); copyPlaceholder(key) }}
                                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/5"
                                            title="Copy"
                                        >
                                            {copied === key
                                                ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                : <Copy className="w-3 h-3 text-black/30" />
                                            }
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: Editor / Preview ───────────────────────────── */}
                <div className="flex flex-col rounded-2xl overflow-hidden border border-[#EAE5DC] bg-[#0A0908]">

                    {/* Tab bar */}
                    <div className="flex items-center border-b border-white/[0.06] shrink-0">
                        {(['code', 'preview'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    px-5 py-3 text-xs font-medium transition-colors capitalize
                                    ${activeTab === tab
                                        ? 'text-white border-b border-white/40 -mb-px'
                                        : 'text-white/30 hover:text-white/60'
                                    }
                                `}
                            >
                                {tab === 'code' ? 'HTML Editor' : 'Preview'}
                            </button>
                        ))}

                        {/* Stats + reset */}
                        <div className="ml-auto flex items-center gap-3 pr-4">
                            <span className="text-[10px] font-mono text-white/20">
                                {lineCount}L · {charCount}ch
                            </span>
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, email_magic_link_template_html: DEFAULT_TEMPLATE }))}
                                title="Reset to default"
                                className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Editor */}
                    {activeTab === 'code' && (
                        <textarea
                            ref={editorRef}
                            value={formData.email_magic_link_template_html}
                            onChange={e => setFormData(prev => ({ ...prev, email_magic_link_template_html: e.target.value }))}
                            spellCheck={false}
                            className="flex-1 w-full bg-transparent text-[#d4cfc8] font-mono text-xs leading-6 p-5 resize-none focus:outline-none"
                            style={{ caretColor: '#EAE5DC' }}
                            placeholder="Paste your HTML template here…"
                        />
                    )}

                    {/* Preview */}
                    {activeTab === 'preview' && (
                        <iframe
                            srcDoc={previewHtml}
                            className="flex-1 w-full bg-white"
                            title="Email Preview"
                            sandbox="allow-same-origin"
                        />
                    )}
                </div>
            </div>

            {/* ── Bottom action bar ────────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 h-8">
                    {toast === 'saved' && (
                        <div className="flex items-center gap-1.5 text-xs text-green-600 animate-in fade-in duration-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Saved
                        </div>
                    )}
                    {toast === 'error' && (
                        <div className="flex items-center gap-1.5 text-xs text-red-500">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/apps/${appId}`)}
                    >
                        Cancel
                    </Button>
                    <button
                        onClick={handleSave}
                        disabled={saving || uploading}
                        className="
                            inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold
                            bg-[#0A0908] text-white hover:bg-black/80 active:scale-95
                            disabled:opacity-50 disabled:cursor-not-allowed transition-all
                        "
                    >
                        {saving
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                            : <><Mail className="w-3.5 h-3.5" /> Save Settings</>
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}
