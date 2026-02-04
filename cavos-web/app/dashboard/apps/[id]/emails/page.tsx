'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Loader2, Mail, Eye } from 'lucide-react'

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 40px 20px;
      }
      .header {
        text-align: center;
        margin-bottom: 32px;
      }
      .logo {
        width: 64px;
        height: 64px;
        border-radius: 12px;
        margin: 0 auto;
      }
      .content {
        background: #ffffff;
        border: 1px solid #e5e5e5;
        border-radius: 12px;
        padding: 32px;
      }
      h1 {
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 16px 0;
        color: #000000;
      }
      p {
        font-size: 16px;
        line-height: 24px;
        color: #737373;
        margin: 0 0 16px 0;
      }
      .button {
        display: inline-block;
        background: #000000;
        color: #ffffff !important;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        margin: 8px 0;
      }
      .button:hover {
        background: #333333;
      }
      .footer {
        margin-top: 32px;
        text-align: center;
        font-size: 14px;
        color: #a3a3a3;
      }
      .small-text {
        font-size: 14px;
        color: #a3a3a3;
        line-height: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="{{app_logo}}" alt="{{app_name}}" class="logo" />
      </div>
      <div class="content">
        <h1>Verify your email</h1>
        <p>Hi there,</p>
        <p>Thanks for signing up for <strong>{{app_name}}</strong>! Please verify your email address to get started.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="{{verification_url}}" class="button">Verify Email Address</a>
        </p>
        <p class="small-text">
          This link expires in 24 hours. If you didn't create an account with {{app_name}}, you can safely ignore this email.
        </p>
      </div>
      <div class="footer">
        <p>&copy; 2026 {{app_name}}. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`

export default function AppEmailsPage() {
    const router = useRouter()
    const params = useParams()
    const appId = params.id as string

    const [app, setApp] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [showPreview, setShowPreview] = useState(false)

    const [formData, setFormData] = useState({
        email_reply_to: '',
        email_from_name: '',
        email_template_html: ''
    })

    useEffect(() => {
        if (appId) {
            fetchApp()
        }
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
            setFormData({
                email_reply_to: data.app.email_reply_to || '',
                email_from_name: data.app.email_from_name || '',
                email_template_html: data.app.email_template_html || ''
            })
        } catch (err) {
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
            const res = await fetch(`/api/apps/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to save settings')
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
        const template = formData.email_template_html || DEFAULT_TEMPLATE
        return template
            .replace(/\{\{verification_url\}\}/g, 'https://cavos.xyz/verify?token=example')
            .replace(/\{\{app_name\}\}/g, app?.name || 'Your App')
            .replace(/\{\{user_email\}\}/g, 'user@example.com')
            .replace(/\{\{app_logo\}\}/g, app?.logo_url || 'https://via.placeholder.com/64')
    }, [formData.email_template_html, app])

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
                    <Link href="/dashboard/apps">
                        <Button variant="outline">Back to Applications</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fadeIn max-w-5xl">
            {/* Back Link */}
            <Link
                href={`/dashboard/apps/${appId}`}
                className="inline-flex items-center text-sm text-black/60 hover:text-black transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to {app?.name}
            </Link>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight mb-2">Email Verification Settings</h1>
                <p className="text-black/60">
                    Customize the verification emails sent when users register with email/password.
                </p>
            </div>

            {/* Settings Card */}
            <Card>
                <div className="space-y-6">
                    {/* Sender Configuration */}
                    <div>
                        <h3 className="text-sm font-semibold mb-4">Email Configuration</h3>

                        {/* Info banner */}
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-900">
                                <strong>Note:</strong> All verification emails are sent from <code className="bg-blue-100 px-1 py-0.5 rounded">noreply@cavos.xyz</code> (verified domain). You can customize the sender name and reply-to address below.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Input
                                    label="Sender Name"
                                    placeholder="Your App Name"
                                    value={formData.email_from_name}
                                    onChange={(e) => setFormData({ ...formData, email_from_name: e.target.value })}
                                />
                                <p className="text-xs text-black/60 mt-1.5">
                                    The name users will see as the sender. Leave empty to use: <code className="bg-black/5 px-1 py-0.5 rounded">{app?.name}</code>
                                </p>
                            </div>

                            <div>
                                <Input
                                    label="Reply-To Email (Optional)"
                                    placeholder="support@yourdomain.com"
                                    type="email"
                                    value={formData.email_reply_to}
                                    onChange={(e) => setFormData({ ...formData, email_reply_to: e.target.value })}
                                />
                                <p className="text-xs text-black/60 mt-1.5">
                                    If users reply to the verification email, their response will be sent to this address. Leave empty if you don't want to receive replies.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Template Editor */}
                    <div className="pt-6 border-t border-black/10">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-1">Email Template</h3>
                                <p className="text-xs text-black/60">
                                    Leave empty to use the default template shown below
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPreview(!showPreview)}
                                icon={<Eye className="w-4 h-4" />}
                            >
                                {showPreview ? 'Hide' : 'Show'} Preview
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Editor */}
                            <div>
                                <label className="block text-xs font-medium text-black/80 mb-2">
                                    Custom HTML Template (Optional)
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all resize-none h-96 text-xs font-mono"
                                    placeholder={DEFAULT_TEMPLATE}
                                    value={formData.email_template_html}
                                    onChange={(e) => setFormData({ ...formData, email_template_html: e.target.value })}
                                />
                                <p className="text-xs text-black/60 mt-2">
                                    Available placeholders:{' '}
                                    <code className="bg-black/5 px-1 py-0.5 rounded">{'{{verification_url}}'}</code>
                                    {', '}
                                    <code className="bg-black/5 px-1 py-0.5 rounded">{'{{app_name}}'}</code>
                                    {', '}
                                    <code className="bg-black/5 px-1 py-0.5 rounded">{'{{user_email}}'}</code>
                                    {', '}
                                    <code className="bg-black/5 px-1 py-0.5 rounded">{'{{app_logo}}'}</code>
                                </p>
                            </div>

                            {/* Preview */}
                            {showPreview && (
                                <div>
                                    <label className="block text-xs font-medium text-black/80 mb-2">
                                        Preview
                                    </label>
                                    <div className="border border-black/10 rounded-lg overflow-hidden h-96">
                                        <iframe
                                            srcDoc={previewHtml}
                                            className="w-full h-full bg-white"
                                            title="Email Preview"
                                        />
                                    </div>
                                    <p className="text-xs text-black/60 mt-2">
                                        This is how your email will appear to users
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Default Template Reference */}
                    {!formData.email_template_html && (
                        <div className="pt-6 border-t border-black/10">
                            <h3 className="text-sm font-semibold mb-2">Default Template</h3>
                            <p className="text-xs text-black/60 mb-3">
                                This is the template that will be used if you don't provide a custom one. You can copy and customize it.
                            </p>
                            <div className="relative">
                                <pre className="bg-black/5 border border-black/10 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                                    {DEFAULT_TEMPLATE}
                                </pre>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                        navigator.clipboard.writeText(DEFAULT_TEMPLATE)
                                    }}
                                >
                                    Copy
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                            Settings saved successfully!
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-black/10">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/dashboard/apps/${appId}`)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            loading={saving}
                            disabled={saving}
                            icon={<Mail className="w-4 h-4" />}
                        >
                            Save Settings
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
