/**
 * Firebase Email/Password Login Route
 *
 * Verifies user credentials, checks email verification, and returns a custom RSA-signed JWT
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { signFirebaseCustomJWT } from '@/lib/firebase-jwt';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password, nonce, app_id } = await request.json();

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

    // Verify credentials using Firebase Auth REST API
    // Firebase Admin SDK doesn't directly verify passwords
    const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;

    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      return NextResponse.json(
        { error: error.error?.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    const { localId } = await verifyResponse.json();

    // Get user record
    const userRecord = await auth.getUser(localId);

    // Check email verification status for this app
    const adminSupabase = createAdminClient();

    // First, check if wallet exists and is verified
    const { data: wallet } = await adminSupabase
      .from('wallets')
      .select('email_verified')
      .eq('user_social_id', userRecord.uid)
      .eq('app_id', app_id)
      .single();

    // If wallet exists and is already verified, proceed
    // If wallet doesn't exist OR exists with email_verified = false, check the token table
    if (!wallet || !wallet.email_verified) {
      const { data: verifiedToken } = await adminSupabase
        .from('email_verification_tokens')
        .select('verified_at')
        .eq('firebase_uid', userRecord.uid)
        .eq('app_id', app_id)
        .not('verified_at', 'is', null)
        .single();

      if (!verifiedToken) {
        return NextResponse.json(
          {
            error: 'email_not_verified',
            message:
              'Please verify your email before logging in. Check your inbox for the verification link.',
          },
          { status: 403 }
        );
      }

      // Token is verified — if wallet exists with email_verified = false, fix it now
      if (wallet && !wallet.email_verified) {
        await adminSupabase
          .from('wallets')
          .update({ email_verified: true, email_verified_at: new Date().toISOString() })
          .eq('user_social_id', userRecord.uid)
          .eq('app_id', app_id);
      }
    }

    // Generate custom JWT with nonce
    const now = Math.floor(Date.now() / 1000);
    const jwt = await signFirebaseCustomJWT({
      sub: userRecord.uid,
      email: userRecord.email!,
      nonce,
      iat: now,
      exp: now + 3600,
    });

    return NextResponse.json({
      jwt,
      uid: userRecord.uid,
      email: userRecord.email,
    });
  } catch (error: any) {
    console.error('Firebase login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
