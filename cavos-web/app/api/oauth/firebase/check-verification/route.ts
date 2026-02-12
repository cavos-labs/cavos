/**
 * Check Email Verification Status
 *
 * Allows SDK to check if email is verified for a specific app
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const app_id = searchParams.get('app_id');
    const email = searchParams.get('email');

    if (!app_id || !email) {
      return NextResponse.json(
        { error: 'Missing app_id or email' },
        { status: 400 }
      );
    }

    // Verify app_id exists
    const adminSupabase = createAdminClient();
    const { data: app, error: appError } = await adminSupabase
      .from('apps')
      .select('id')
      .eq('id', app_id)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: 'Invalid app_id' }, { status: 400 });
    }

    // Check if any wallet for this email+app is verified
    const { data: wallet } = await adminSupabase
      .from('wallets')
      .select('email_verified')
      .eq('email', email)
      .eq('app_id', app_id)
      .single();

    if (wallet?.email_verified) {
      return NextResponse.json({ verified: true });
    }

    // Check if a verification token was verified
    const { data: verifiedToken } = await adminSupabase
      .from('email_verification_tokens')
      .select('verified_at')
      .eq('email', email)
      .eq('app_id', app_id)
      .not('verified_at', 'is', null)
      .single();

    return NextResponse.json({
      verified: !!verifiedToken,
    });
  } catch (error: any) {
    console.error('Check verification error:', error);
    return NextResponse.json(
      { error: 'Failed to check verification status' },
      { status: 500 }
    );
  }
}
