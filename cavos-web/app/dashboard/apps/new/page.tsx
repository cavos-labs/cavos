'use client'

import { Suspense } from 'react'
import { NewAppForm } from './NewAppForm'

export default function NewAppPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
            <div className="text-black/60">Loading...</div>
        </div>}>
            <NewAppForm />
        </Suspense>
    )
}
