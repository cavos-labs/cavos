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
        logo_url: initialData?.logo_url || ''
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
