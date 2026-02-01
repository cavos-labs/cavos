/**
 * Firebase Email/Password Login Route
 *
 * Verifies user credentials and returns a custom RSA-signed JWT
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { signFirebaseCustomJWT } from '@/lib/firebase-jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password, nonce } = await request.json();

    if (!email || !password || !nonce) {
      return NextResponse.json(
        { error: 'Missing email, password, or nonce' },
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
