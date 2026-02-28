'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Loader2, Mail, Eye, Upload, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [app, setApp] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [showPreview, setShowPreview] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        logo_url: '',
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
                name: data.app.name || '',
                logo_url: data.app.logo_url || '',
                email_reply_to: data.app.email_reply_to || '',
                email_from_name: data.app.email_from_name || '',
                email_template_html: data.app.email_template_html || DEFAULT_TEMPLATE
            })
        } catch (err) {
            setError('Failed to load application')
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${fileName}`

        setUploading(true)
        setError('')

        try {
            const supabase = createClient()
            const { error: uploadError } = await supabase.storage
                .from('app-icons')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('app-icons')
                .getPublicUrl(filePath)

            setFormData(prev => ({ ...prev, logo_url: publicUrl }))
        } catch (err) {
            console.error('Error uploading image:', err)
            setError('Failed to upload image')
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setError('')
        setSuccess(false)

        try {
            const templateToSave = formData.email_template_html === DEFAULT_TEMPLATE ? '' : formData.email_template_html

            const res = await fetch(`/api/apps/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    logo_url: formData.logo_url,
                    email_reply_to: formData.email_reply_to,
                    email_from_name: formData.email_from_name,
                    email_template_html: templateToSave
                }),
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
            .replace(/\{\{app_name\}\}/g, formData.name || 'Your App')
            .replace(/\{\{user_email\}\}/g, 'user@example.com')
            .replace(/\{\{app_logo\}\}/g, formData.logo_url || 'https://via.placeholder.com/64')
    }, [formData.email_template_html, formData.name, formData.logo_url])

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
                    {/* App Info */}
                    <div>
                        <h3 className="text-sm font-semibold mb-4">App Information</h3>
                        <p className="text-xs text-black/60 mb-4">
                            These values are used in the email template placeholders.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <Input
                                    label="App Name"
                                    placeholder="My Awesome App"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                <p className="text-xs text-black/60 mt-1.5">
                                    Used in <code className="bg-black/5 px-1 py-0.5 rounded">{'{{app_name}}'}</code> placeholder
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black/80 mb-2">
                                    App Logo
                                </label>
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className={`
                                            w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden border border-black/10
                                            ${!formData.logo_url ? 'bg-black/5' : 'bg-white'}
                                        `}>
                                            {formData.logo_url ? (
                                                <Image
                                                    src={formData.logo_url}
                                                    alt="App Logo"
                                                    width={96}
                                                    height={96}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <ImageIcon className="w-8 h-8 text-black/20" />
                                            )}

                                            {/* Overlay */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-white hover:text-white hover:bg-white/20"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <p className="text-xs text-black/60 mb-2">
                                                Recommended size: 64x64px. Max size: 2MB. Supports JPG, PNG and WEBP.
                                            </p>
                                            <p className="text-xs text-black/60">
                                                Used in <code className="bg-black/5 px-1 py-0.5 rounded">{'{{app_logo}}'}</code> placeholder
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            {formData.logo_url && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setFormData({ ...formData, logo_url: '' })}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                >
                                                    Remove Logo
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                            >
                                                {uploading ? 'Uploading...' : 'Upload Image'}
                                            </Button>
                                        </div>

                                        <Input
                                            label="Or paste image URL"
                                            placeholder="https://yourdomain.com/logo.png"
                                            value={formData.logo_url}
                                            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sender Configuration */}
                    <div className="pt-6 border-t border-black/10">
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
                                    The name users will see as the sender. Leave empty to use: <code className="bg-black/5 px-1 py-0.5 rounded">{formData.name || 'App Name'}</code>
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

                    {/* Email Template */}
                    <div className="pt-6 border-t border-black/10">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-1">Email Template</h3>
                                <p className="text-xs text-black/60">
                                    Edit the template below. Empty templates will use Cavos default automatically.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFormData({ ...formData, email_template_html: DEFAULT_TEMPLATE })}
                                >
                                    Reset to Default
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowPreview(!showPreview)}
                                    icon={<Eye className="w-4 h-4" />}
                                >
                                    {showPreview ? 'Hide' : 'Show'} Preview
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Editor */}
                            <div>
                                <label className="block text-xs font-medium text-black/80 mb-2">
                                    HTML Template
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all resize-none h-96 text-xs font-mono"
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
                            loading={saving || uploading}
                            disabled={saving || uploading}
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
