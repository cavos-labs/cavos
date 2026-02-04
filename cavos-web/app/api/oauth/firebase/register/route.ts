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

    // Check for existing pending verification token (rate limiting)
    const { data: existingToken } = await adminSupabase
      .from('email_verification_tokens')
      .select('token, last_sent_at, firebase_uid')
      .eq('email', email)
      .eq('app_id', app_id)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Rate limiting: Check if verification email was sent recently
    if (existingToken?.last_sent_at) {
      const lastSentAt = new Date(existingToken.last_sent_at);
      const now = new Date();
      const timeDiff = (now.getTime() - lastSentAt.getTime()) / 1000; // seconds

      if (timeDiff < 60) {
        const waitTime = Math.ceil(60 - timeDiff);
        return NextResponse.json(
          {
            error: 'rate_limited',
            message: `Verification email already sent. Please wait ${waitTime} seconds before requesting another.`,
            wait_seconds: waitTime
          },
          { status: 429 }
        );
      }
    }

    // Try to create Firebase user or get existing user
    let userRecord;
    let isExistingUser = false;

    try {
      userRecord = await auth.createUser({
        email,
        password,
        emailVerified: false,
      });
    } catch (firebaseError: any) {
      if (firebaseError.code === 'auth/email-already-exists') {
        // User exists but hasn't verified - allow resend
        isExistingUser = true;

        // Get the existing Firebase user
        try {
          userRecord = await auth.getUserByEmail(email);

          // If already verified in Firebase, shouldn't happen but handle it
          if (userRecord.emailVerified) {
            return NextResponse.json(
              { error: 'Email already registered and verified' },
              { status: 409 }
            );
          }
        } catch (getUserError) {
          throw firebaseError; // Re-throw original error
        }
      } else {
        throw firebaseError;
      }
    }

    // Generate secure verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // If existing token for this email+app, invalidate it
    if (existingToken) {
      await adminSupabase
        .from('email_verification_tokens')
        .update({ expires_at: new Date().toISOString() })
        .eq('token', existingToken.token);
    }

    // Store verification token with rate limiting timestamp
    const { error: tokenError } = await adminSupabase
      .from('email_verification_tokens')
      .insert({
        token,
        email: userRecord.email!,
        app_id,
        firebase_uid: userRecord.uid,
        expires_at: expiresAt.toISOString(),
        last_sent_at: new Date().toISOString(),
      });

    if (tokenError) {
      console.error('Failed to store verification token:', tokenError);
      // Only delete the Firebase user if we just created it
      if (!isExistingUser) {
        await auth.deleteUser(userRecord.uid);
      }
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
      message: isExistingUser
        ? 'Verification email resent. Please check your email to verify your account'
        : 'Please check your email to verify your account',
    });
  } catch (error: any) {
    console.error('Firebase registration error:', error);

    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
