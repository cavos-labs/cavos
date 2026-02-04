/**
 * Firebase Email/Password Registration Route
 *
 * Creates a new Firebase user and sends email verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVerificationEmail } from '@/lib/email/verification';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, password, nonce, app_id } = await request.json();

    // Validate input
    if (!email || !password || !nonce) {
      return NextResponse.json(
        { error: 'Missing email, password, or nonce' },
        { status: 400 }
      );
    }

    if (!app_id) {
      return NextResponse.json(
        { error: 'Missing app_id' },
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
      return NextResponse.json(
        { error: 'Invalid app_id' },
        { status: 400 }
      );
    }

    // Create Firebase user
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false,
    });

    // Generate secure verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    const { error: tokenError } = await adminSupabase
      .from('email_verification_tokens')
      .insert({
        token,
        email: userRecord.email!,
        app_id,
        firebase_uid: userRecord.uid,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Failed to store verification token:', tokenError);
      // Delete the Firebase user since we can't verify
      await auth.deleteUser(userRecord.uid);
      return NextResponse.json(
        { error: 'Failed to create verification token' },
        { status: 500 }
      );
    }

    // Send verification email
    try {
      await sendVerificationEmail(email, token, app_id);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't delete user, they can request resend
    }

    return NextResponse.json({
      status: 'verification_required',
      email: userRecord.email,
      message: 'Please check your email to verify your account',
    });
  } catch (error: any) {
    console.error('Firebase registration error:', error);

    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
