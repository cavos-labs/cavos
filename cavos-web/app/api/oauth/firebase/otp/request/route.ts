/**
 * Firebase Email OTP - Request Route
 *
 * Generates a Cavos-owned one-time email code for passwordless sign-in.
 * Firebase is used as the user directory; Cavos verifies the OTP and signs
 * the RS256 JWT used by the account contract.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOtpEmail } from '@/lib/email/otp';
import crypto from 'crypto';

const OTP_EXPIRES_MINUTES = 10;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
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
    const nonce = typeof body.nonce === 'string' ? body.nonce : '';
    const app_id = typeof body.app_id === 'string' ? body.app_id : '';

    if (!email || !nonce || !app_id) {
      return NextResponse.json(
        { error: 'Missing email, nonce, or app_id' },
        { status: 400 }
      );
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

    const { data: existingOtp } = await adminSupabase
      .from('email_otp_codes')
      .select('id, last_sent_at')
      .eq('email', email)
      .eq('app_id', app_id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingOtp?.last_sent_at) {
      const elapsed = (Date.now() - new Date(existingOtp.last_sent_at).getTime()) / 1000;
      if (elapsed < 60) {
        const waitSeconds = Math.ceil(60 - elapsed);
        return NextResponse.json(
          {
            error: 'rate_limited',
            message: `Please wait ${waitSeconds} seconds before requesting another code.`,
            wait_seconds: waitSeconds,
          },
          { status: 429 }
        );
      }
    }

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({ email });
      } else {
        throw err;
      }
    }

    const code = generateOtp();
    const codeHash = hashOtp(code, email, app_id, nonce);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRES_MINUTES * 60 * 1000);

    if (existingOtp?.id) {
      await adminSupabase
        .from('email_otp_codes')
        .update({ expires_at: now.toISOString() })
        .eq('id', existingOtp.id);
    }

    const { error: insertError } = await adminSupabase
      .from('email_otp_codes')
      .insert({
        email,
        app_id,
        firebase_uid: userRecord.uid,
        code_hash: codeHash,
        nonce,
        expires_at: expiresAt.toISOString(),
        last_sent_at: now.toISOString(),
      });

    if (insertError) {
      console.error('[OTP] Failed to store OTP:', insertError);
      return NextResponse.json(
        { error: 'Failed to create OTP' },
        { status: 500 }
      );
    }

    await sendOtpEmail(email, code, app_id, OTP_EXPIRES_MINUTES);

    console.log(`[OTP] Code sent to ${email} (uid: ${userRecord.uid}) for app ${app_id}`);
    return NextResponse.json({
      status: 'sent',
      email,
      expires_in: OTP_EXPIRES_MINUTES * 60,
    });
  } catch (error: any) {
    console.error('[OTP] Request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
