/**
 * Public app branding (name, logo) for app reset-password / verification pages.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const appId = request.nextUrl.searchParams.get('app_id');
    if (!appId) {
      return NextResponse.json({ error: 'Missing app_id' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { data: app, error } = await adminSupabase
      .from('apps')
      .select('name, logo_url')
      .eq('id', appId)
      .single();

    if (error || !app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    return NextResponse.json({ name: app.name || 'App', logo_url: app.logo_url || null });
  } catch (e) {
    console.error('[oauth/firebase/app-branding]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
