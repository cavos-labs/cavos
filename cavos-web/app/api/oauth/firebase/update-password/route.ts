/**
 * Update Password – Firebase (app end-users only). Confirms reset via Identity Toolkit REST API.
 */

import { NextRequest, NextResponse } from 'next/server';

const RESET_PASSWORD_URL = `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${process.env.FIREBASE_API_KEY}`;

export async function POST(request: NextRequest) {
  try {
    const { oobCode, newPassword } = await request.json();

    if (!oobCode || typeof oobCode !== 'string' || !oobCode.trim()) {
      return NextResponse.json({ error: 'Missing or invalid oobCode' }, { status: 400 });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const res = await fetch(RESET_PASSWORD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oobCode: oobCode.trim(),
        newPassword,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data?.error?.message || '';
      if (message.includes('INVALID_OOB_CODE') || message.includes('EXPIRED_OOB_CODE') || message.includes('INVALID_ACTION_CODE')) {
        return NextResponse.json({ error: 'This reset link is invalid or has expired. Please request a new one.' }, { status: 400 });
      }
      return NextResponse.json({ error: data?.error?.message || 'Failed to update password' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: unknown) {
    console.error('[oauth/firebase/update-password]', err);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
