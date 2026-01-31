import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Calculate date range (last 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6); // 7 days including today
        startDate.setHours(0, 0, 0, 0);

        // Fetch wallets created in the last 7 days
        // RLS will ensure we only get wallets for apps owned by the user
        const { data: wallets, error: walletsError } = await supabase
            .from('wallets')
            .select('created_at')
            .gte('created_at', startDate.toISOString());

        if (walletsError) {
            console.error('Error fetching wallets:', walletsError);
            return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
        }

        // Fetch transactions created in the last 7 days
        const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('created_at')
            .gte('created_at', startDate.toISOString());

        if (transactionsError) {
            console.error('Error fetching transactions:', transactionsError);
            return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
        }

        // Aggregate data by date
        const statsMap = new Map<string, { date: string; wallets: number; transactions: number }>();

        // Initialize map with all dates in range
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            statsMap.set(dateStr, {
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                wallets: 0,
                transactions: 0
            });
        }

        // Count wallets
        wallets?.forEach(w => {
            const dateStr = new Date(w.created_at).toISOString().split('T')[0];
            if (statsMap.has(dateStr)) {
                const stat = statsMap.get(dateStr)!;
                stat.wallets++;
            }
        });

        // Count transactions
        transactions?.forEach(t => {
            const dateStr = new Date(t.created_at).toISOString().split('T')[0];
            if (statsMap.has(dateStr)) {
                const stat = statsMap.get(dateStr)!;
                stat.transactions++;
            }
        });

        const data = Array.from(statsMap.values());

        return NextResponse.json({ stats: data });

    } catch (error) {
        console.error('Analytics stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
