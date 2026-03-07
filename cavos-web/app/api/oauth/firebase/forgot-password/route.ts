/**
 * Forgot Password – Firebase (app end-users only). Sends white-labeled reset email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPasswordResetEmail } from '@/lib/email/password-reset';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://cavos.xyz';

export async function POST(request: NextRequest) {
  try {
    const { email, app_id } = await request.json();

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Missing or invalid email' }, { status: 400 });
    }
    if (!app_id) {
      return NextResponse.json({ error: 'Missing app_id' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { data: app, error: appError } = await adminSupabase
      .from('apps')
      .select('id')
      .eq('id', app_id)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: 'Invalid app_id' }, { status: 400 });
    }

    let resetLink: string;
    try {
      resetLink = await auth.generatePasswordResetLink(email.trim(), {
        url: `${BASE_URL}/apps/${app_id}/reset-password`,
      });
    } catch (err: unknown) {
      const msg = err && typeof (err as { message?: string }).message === 'string' ? (err as { message: string }).message : '';
      if (String(msg).toLowerCase().includes('user') && String(msg).toLowerCase().includes('not found')) {
        return NextResponse.json({ error: 'No account found for this email' }, { status: 404 });
      }
      console.error('[oauth/firebase/forgot-password]', err);
      return NextResponse.json({ error: 'Failed to generate reset link' }, { status: 500 });
    }

    const oobCode = new URL(resetLink).searchParams.get('oobCode');
    const brandedLink = oobCode
      ? `${BASE_URL}/apps/${encodeURIComponent(app_id)}/reset-password?oobCode=${encodeURIComponent(oobCode)}`
      : resetLink;

    try {
      await sendPasswordResetEmail(email.trim(), brandedLink, app_id);
    } catch (emailErr) {
      console.error('[oauth/firebase/forgot-password] send email', emailErr);
      return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('[oauth/firebase/forgot-password]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
