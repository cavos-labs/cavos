'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Loader2, Lock, Eye } from 'lucide-react'

const DEFAULT_PASSWORD_RESET_TEMPLATE = `<!DOCTYPE html>
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
      .button { display: inline-block; background: #000000; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 8px 0; }
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
        <h1>Reset your password</h1>
        <p>Hi there,</p>
        <p>You requested a password reset for <strong>{{app_name}}</strong>. Click the button below to set a new password.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="{{reset_link}}" class="button">Reset Password</a>
        </p>
        <p class="small-text">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>&copy; 2026 {{app_name}}. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`

export default function PasswordResetEmailPage() {
    const router = useRouter()
    const params = useParams()
    const appId = params.id as string

    const [app, setApp] = useState<{ name: string; logo_url: string | null } | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [template, setTemplate] = useState(DEFAULT_PASSWORD_RESET_TEMPLATE)
    const [showPreview, setShowPreview] = useState(false)

    useEffect(() => {
        if (appId) fetchApp()
    }, [appId])

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
            setTemplate(data.app.email_password_reset_template_html ?? DEFAULT_PASSWORD_RESET_TEMPLATE)
        } catch (e) {
            setError('Failed to load application')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setError('')
        setSuccess(false)
        try {
            const toSave = template === DEFAULT_PASSWORD_RESET_TEMPLATE ? '' : template
            const res = await fetch(`/api/apps/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email_password_reset_template_html: toSave }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to save')
            }
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const previewHtml = useMemo(() => {
        const t = template || DEFAULT_PASSWORD_RESET_TEMPLATE
        return t
            .replace(/\{\{reset_link\}\}/g, 'https://cavos.xyz/apps/example-app-id/reset-password?oobCode=example')
            .replace(/\{\{app_name\}\}/g, app?.name || 'Your App')
            .replace(/\{\{user_email\}\}/g, 'user@example.com')
            .replace(/\{\{app_logo\}\}/g, app?.logo_url || 'https://via.placeholder.com/64')
    }, [template, app?.name, app?.logo_url])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-black/20" />
            </div>
        )
    }

    if (error && !app) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Link href={`/dashboard/apps/${appId}`}>
                        <Button variant="outline">Back to app</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fadeIn max-w-5xl">
            <Link
                href={`/dashboard/apps/${appId}`}
                className="inline-flex items-center text-sm text-black/60 hover:text-black transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to {app?.name}
            </Link>

            <div>
                <h1 className="text-2xl font-semibold tracking-tight mb-2">Password reset custom email</h1>
                <p className="text-black/60">
                    Customize the email sent when users request a password reset (forgot password). App name and logo are shared from your app settings.
                </p>
            </div>

            <Card>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold mb-1">Password reset email template</h3>
                            <p className="text-xs text-black/60">Edit the HTML below. Empty uses Cavos default.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setTemplate(DEFAULT_PASSWORD_RESET_TEMPLATE)}>
                                Reset to default
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} icon={<Eye className="w-4 h-4" />}>
                                {showPreview ? 'Hide' : 'Show'} preview
                            </Button>
                        </div>
                    </div>

                    {/* Placeholders for password reset */}
                    <div className="p-4 bg-black/5 rounded-lg border border-black/10">
                        <h4 className="text-xs font-semibold text-black/80 mb-3">Available placeholders (use these in your HTML)</h4>
                        <ul className="space-y-2 text-xs text-black/70">
                            <li>
                                <code className="bg-white border border-black/10 px-1.5 py-0.5 rounded font-mono">{'{{reset_link}}'}</code>
                                <span className="ml-2">— Link where the user sets a new password</span>
                            </li>
                            <li>
                                <code className="bg-white border border-black/10 px-1.5 py-0.5 rounded font-mono">{'{{app_name}}'}</code>
                                <span className="ml-2">— Your app name (from app settings)</span>
                            </li>
                            <li>
                                <code className="bg-white border border-black/10 px-1.5 py-0.5 rounded font-mono">{'{{app_logo}}'}</code>
                                <span className="ml-2">— Your app logo URL (from app settings)</span>
                            </li>
                            <li>
                                <code className="bg-white border border-black/10 px-1.5 py-0.5 rounded font-mono">{'{{user_email}}'}</code>
                                <span className="ml-2">— Email address of the user requesting the reset</span>
                            </li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-black/80 mb-2">HTML template</label>
                            <textarea
                                className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all resize-none h-80 text-xs font-mono"
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                            />
                            <p className="text-xs text-black/60 mt-2">
                                Copy any placeholder from the list above into your template (e.g. <code className="bg-black/5 px-1 py-0.5 rounded">{'{{reset_link}}'}</code> for the button link).
                            </p>
                        </div>
                        {showPreview && (
                            <div>
                                <label className="block text-xs font-medium text-black/80 mb-2">Preview</label>
                                <div className="border border-black/10 rounded-lg overflow-hidden h-80">
                                    <iframe srcDoc={previewHtml} className="w-full h-full bg-white" title="Password reset email preview" />
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                            Settings saved successfully!
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-black/10">
                        <Button variant="outline" onClick={() => router.push(`/dashboard/apps/${appId}`)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} loading={saving} disabled={saving} icon={<Lock className="w-4 h-4" />}>
                            Save
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
