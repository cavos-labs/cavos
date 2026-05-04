/**
 * Firebase Email OTP - Verify Route
 *
 * Verifies a Cavos-owned email OTP and returns the same custom RS256 JWT shape
 * used by the existing Firebase email/password and magic-link flows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signFirebaseCustomJWT } from '@/lib/firebase-jwt';
import crypto from 'crypto';

const MAX_ATTEMPTS = 5;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashOtp(code: string, email: string, appId: string, nonce: string): string {
  const pepper = process.env.EMAIL_OTP_PEPPER || process.env.FIREBASE_RSA_PRIVATE_KEY || '';
  return crypto
    .createHash('sha256')
    .update(`${pepper}:${appId}:${email}:${nonce}:${code}`)
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const nonce = typeof body.nonce === 'string' ? body.nonce : '';
    const app_id = typeof body.app_id === 'string' ? body.app_id : '';

    if (!email || !code || !nonce || !app_id) {
      return NextResponse.json(
        { error: 'Missing email, code, nonce, or app_id' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { data: otp, error: otpError } = await adminSupabase
      .from('email_otp_codes')
      .select('id, email, app_id, firebase_uid, code_hash, nonce, expires_at, attempt_count, used_at')
      .eq('email', email)
      .eq('app_id', app_id)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error('[OTP] Lookup failed:', otpError);
      return NextResponse.json({ error: 'verification_failed' }, { status: 500 });
    }

    if (!otp) {
      return NextResponse.json({ error: 'invalid_code' }, { status: 401 });
    }

    if (otp.nonce !== nonce) {
      return NextResponse.json({ error: 'invalid_nonce' }, { status: 401 });
    }

    if (otp.used_at) {
      return NextResponse.json({ error: 'code_used' }, { status: 401 });
    }

    if (new Date(otp.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'code_expired' }, { status: 401 });
    }

    if ((otp.attempt_count || 0) >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'too_many_attempts' }, { status: 429 });
    }

    const submittedHash = hashOtp(code, email, app_id, nonce);
    const matches = crypto.timingSafeEqual(
      Buffer.from(submittedHash, 'hex'),
      Buffer.from(otp.code_hash, 'hex')
    );

    if (!matches) {
      await adminSupabase
        .from('email_otp_codes')
        .update({ attempt_count: (otp.attempt_count || 0) + 1 })
        .eq('id', otp.id);

      return NextResponse.json({ error: 'invalid_code' }, { status: 401 });
    }

    const usedAt = new Date().toISOString();
    const { error: updateError } = await adminSupabase
      .from('email_otp_codes')
      .update({ used_at: usedAt })
      .eq('id', otp.id)
      .is('used_at', null);

    if (updateError) {
      console.error('[OTP] Failed to mark OTP used:', updateError);
      return NextResponse.json({ error: 'verification_failed' }, { status: 500 });
    }

    const now = Math.floor(Date.now() / 1000);
    const jwt = await signFirebaseCustomJWT({
      sub: otp.firebase_uid,
      email,
      nonce,
      iat: now,
      exp: now + 3600,
    });

    console.log(`[OTP] Verified and signed JWT for ${email} (uid: ${otp.firebase_uid})`);
    return NextResponse.json({
      jwt,
      uid: otp.firebase_uid,
      email,
    });
  } catch (error: any) {
    console.error('[OTP] Verify error:', error);
    return NextResponse.json(
      { error: error.message || 'OTP verification failed' },
      { status: 500 }
    );
  }
}
