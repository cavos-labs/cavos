/**
 * Firebase Email/Password Registration Route
 *
 * Creates a new Firebase user and returns a custom RSA-signed JWT
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { signFirebaseCustomJWT } from '@/lib/firebase-jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password, nonce } = await request.json();

    // Validate input
    if (!email || !password || !nonce) {
      return NextResponse.json(
        { error: 'Missing email, password, or nonce' },
        { status: 400 }
      );
    }

    // Create Firebase user
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false, // Can implement email verification later
    });

    // Generate custom JWT with nonce
    const now = Math.floor(Date.now() / 1000);
    const jwt = await signFirebaseCustomJWT({
      sub: userRecord.uid,
      email: userRecord.email!,
      nonce,
      iat: now,
      exp: now + 3600, // 1 hour expiry
    });

    return NextResponse.json({
      jwt,
      uid: userRecord.uid,
      email: userRecord.email,
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
