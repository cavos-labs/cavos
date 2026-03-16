import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const DPA_VERSION = '1.0'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('dpa_accepted_at, dpa_version')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            accepted: !!profile?.dpa_accepted_at,
            accepted_at: profile?.dpa_accepted_at ?? null,
            version: profile?.dpa_version ?? null,
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminSupabase = createAdminClient()
        await adminSupabase
            .from('profiles')
            .update({
                dpa_accepted_at: new Date().toISOString(),
                dpa_version: DPA_VERSION,
            })
            .eq('id', user.id)

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
