'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface AppFormProps {
    initialData?: {
        id?: string
        name: string
        description?: string
        logo_url?: string
        organization_id?: string
    }
    organizations?: any[]
    mode: 'create' | 'edit'
    onSuccess?: () => void
    onCancel?: () => void
}

export function AppForm({ initialData, organizations, mode, onSuccess, onCancel }: AppFormProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        organization_id: initialData?.organization_id || '',
        logo_url: initialData?.logo_url || '',
        email_from_address: (initialData as any)?.email_from_address || '',
        email_from_name: (initialData as any)?.email_from_name || '',
        email_template_html: (initialData as any)?.email_template_html || ''
    })

    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const url = mode === 'create' ? '/api/apps' : `/api/apps/${initialData?.id}`
            const method = mode === 'create' ? 'POST' : 'PATCH'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to save application')
            }

            if (onSuccess) {
                onSuccess()
            } else {
                router.push('/dashboard/apps')
                router.refresh()
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Icon Upload */}
            <div className="flex items-center gap-6">
                <div className="relative group">
                    <div className={`
                        w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden border border-black/10
                        ${!formData.logo_url ? 'bg-black/5' : 'bg-white'}
                    `}>
                        {formData.logo_url ? (
                            <Image
                                src={formData.logo_url}
                                alt="App Icon"
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

                <div className="flex-1">
                    <h3 className="text-sm font-medium mb-1">App Icon</h3>
                    <p className="text-xs text-black/60 mb-3">
                        Recommended size: 512x512px. Max size: 2MB.
                        <br />
                        Supports JPG, PNG and WEBP.
                    </p>
                    {formData.logo_url && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                            Remove Icon
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <Input
                    label="Application Name"
                    placeholder="e.g. My Awesome App"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-black/80 mb-1.5">
                        Description
                    </label>
                    <textarea
                        className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all resize-none h-24 text-sm"
                        placeholder="Brief description of your application..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* Email Customization Section */}
                <div className="pt-4 border-t border-black/5">
                    <h3 className="text-sm font-semibold text-black mb-1">Email Verification Settings</h3>
                    <p className="text-xs text-black/60 mb-4">
                        Customize the verification emails sent to your users when they register with email/password.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <Input
                                label="From Email Address"
                                placeholder="noreply@yourdomain.com"
                                value={formData.email_from_address}
                                onChange={(e) => setFormData({ ...formData, email_from_address: e.target.value })}
                            />
                            <p className="text-xs text-black/60 mt-1.5">
                                The email address verification emails will be sent from. Leave empty to use Cavos default (noreply@cavos.xyz).
                            </p>
                        </div>

                        <div>
                            <Input
                                label="From Name"
                                placeholder="Your App Name"
                                value={formData.email_from_name}
                                onChange={(e) => setFormData({ ...formData, email_from_name: e.target.value })}
                            />
                            <p className="text-xs text-black/60 mt-1.5">
                                The name shown as the sender. Leave empty to use your app name.
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-black/80">
                                    Custom Email Template (Optional)
                                </label>
                                {!formData.email_template_html && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFormData({
                                            ...formData,
                                            email_template_html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { width: 64px; height: 64px; border-radius: 12px; }
    .content { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 32px; }
    h1 { font-size: 24px; font-weight: 600; margin: 0 0 16px 0; color: #000000; }
    p { font-size: 16px; line-height: 24px; color: #737373; margin: 0 0 16px 0; }
    .button { display: inline-block; background: #000000; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 8px 0; }
    .footer { margin-top: 32px; text-align: center; font-size: 14px; color: #a3a3a3; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      {{#if app_logo}}
      <img src="{{app_logo}}" alt="{{app_name}}" class="logo" />
      {{/if}}
    </div>
    <div class="content">
      <h1>Verify your email</h1>
      <p>Hi there,</p>
      <p>Thanks for signing up for {{app_name}}! Please verify your email address to get started.</p>
      <p style="text-align: center;">
        <a href="{{verification_url}}" class="button">Verify Email Address</a>
      </p>
      <p style="font-size: 14px; color: #a3a3a3;">
        This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} {{app_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
                                        })}
                                        className="text-xs"
                                    >
                                        Insert Example Template
                                    </Button>
                                )}
                            </div>
                            <textarea
                                className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all resize-none h-64 text-xs font-mono"
                                placeholder="Leave empty to use default template..."
                                value={formData.email_template_html}
                                onChange={(e) => setFormData({ ...formData, email_template_html: e.target.value })}
                            />
                            <p className="text-xs text-black/60 mt-1.5">
                                HTML template for verification emails. Available placeholders: <code className="bg-black/5 px-1 py-0.5 rounded text-xs">{'{{verification_url}}'}</code>, <code className="bg-black/5 px-1 py-0.5 rounded text-xs">{'{{app_name}}'}</code>, <code className="bg-black/5 px-1 py-0.5 rounded text-xs">{'{{user_email}}'}</code>, <code className="bg-black/5 px-1 py-0.5 rounded text-xs">{'{{app_logo}}'}</code>
                            </p>
                        </div>
                    </div>
                </div>

                {mode === 'create' && organizations && (
                    <div>
                        <label className="block text-sm font-medium text-black/80 mb-1.5">
                            Organization
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none text-sm"
                            value={formData.organization_id}
                            onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                            required
                        >
                            <option value="" disabled>Select an organization</option>
                            {organizations.map((org) => (
                                <option key={org.id} value={org.id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    loading={loading || uploading}
                    disabled={loading || uploading}
                >
                    {mode === 'create' ? 'Create Application' : 'Save Changes'}
                </Button>
            </div>
        </form>
    )
}
