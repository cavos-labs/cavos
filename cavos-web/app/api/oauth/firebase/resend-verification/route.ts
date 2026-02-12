/**
 * Resend Verification Email
 *
 * Allows users to request a new verification email
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVerificationEmail } from '@/lib/email/verification';
import crypto from 'crypto';

// Simple in-memory rate limiter (replace with Redis in production)
const rateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>();

function checkRateLimit(
  key: string,
  maxRequests = 3,
  windowMs = 600000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { email, app_id } = await request.json();

    if (!email || !app_id) {
      return NextResponse.json(
        { error: 'Missing email or app_id' },
        { status: 400 }
      );
    }

    // Rate limiting: 3 requests per 10 minutes per email+app_id
    const rateLimitKey = `resend:${email}:${app_id}`;
    if (!checkRateLimit(rateLimitKey, 3, 600000)) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again in 10 minutes.',
        },
        { status: 429 }
      );
    }

    const adminSupabase = createAdminClient();

    // Verify app_id exists
    const { data: app, error: appError } = await adminSupabase
      .from('apps')
      .select('id')
      .eq('id', app_id)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: 'Invalid app_id' }, { status: 400 });
    }

    // Check if already verified
    const { data: wallet } = await adminSupabase
      .from('wallets')
      .select('email_verified')
      .eq('email', email)
      .eq('app_id', app_id)
      .single();

    if (wallet?.email_verified) {
      return NextResponse.json({
        message: 'Email already verified',
        already_verified: true,
      });
    }

    // Check if verified token exists
    const { data: verifiedToken } = await adminSupabase
      .from('email_verification_tokens')
      .select('verified_at')
      .eq('email', email)
      .eq('app_id', app_id)
      .not('verified_at', 'is', null)
      .single();

    if (verifiedToken) {
      return NextResponse.json({
        message: 'Email already verified',
        already_verified: true,
      });
    }

    // Get Firebase user
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'User not found. Please register first.' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Invalidate old tokens for this email+app
    await adminSupabase
      .from('email_verification_tokens')
      .update({ expires_at: new Date().toISOString() })
      .eq('email', email)
      .eq('app_id', app_id)
      .is('verified_at', null);

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { error: tokenError } = await adminSupabase
      .from('email_verification_tokens')
      .insert({
        token,
        email,
        app_id,
        firebase_uid: userRecord.uid,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Failed to create verification token:', tokenError);
      return NextResponse.json(
        { error: 'Failed to create verification token' },
        { status: 500 }
      );
    }

    // Send email
    try {
      await sendVerificationEmail(email, token, app_id);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification email sent',
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
