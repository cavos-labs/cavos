'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EventTable } from '@/app/dashboard/activity/page'
import { PageSkeleton } from '@/components/ui/Skeleton'

export default function AppActivityPage() { const { id } = useParams<{ id: string }>(); const [events,setEvents]=useState<any[]>([]); const [loading,setLoading]=useState(true); useEffect(()=>{fetch(`/api/operations/events?app_id=${id}`).then(r=>r.json()).then(d=>setEvents(d.events??[])).finally(()=>setLoading(false))},[id]); if(loading)return <PageSkeleton/>; return <div className="space-y-6"><PageHeader title="Activity" subtitle="Cavos-controlled operations for this application."/><EventTable events={events}/></div> }
