import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type RouteContext = {
    params: Promise<{ id: string; walletId: string }>
}

// GET /api/apps/[id]/wallets/[walletId]/transactions - Get transactions for a specific wallet
export async function GET(request: Request, context: RouteContext) {
    try {
        const { id, walletId } = await context.params
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify app ownership
        const { data: app, error: appError } = await supabase
            .from('apps')
            .select(`
        id,
        organization:organizations!inner(owner_id)
      `)
            .eq('id', id)
            .single()

        if (appError || !app) {
            return NextResponse.json({ error: 'App not found' }, { status: 404 })
        }

        const organization = app.organization as unknown as { owner_id: string }
        if (organization.owner_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Verify wallet belongs to app
        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('id')
            .eq('id', walletId)
            .eq('app_id', id)
            .single()

        if (walletError || !wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
        }

        // Fetch transactions
        const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('wallet_id', walletId)
            .order('created_at', { ascending: false })

        if (transactionsError) {
            console.error('Error fetching transactions:', transactionsError)
            return NextResponse.json({ error: transactionsError.message }, { status: 500 })
        }

        return NextResponse.json({ transactions })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
