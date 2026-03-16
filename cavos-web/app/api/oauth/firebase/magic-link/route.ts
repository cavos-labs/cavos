/**
 * Magic Link — Request Route
 *
 * Generates a Firebase email sign-in link, extracts the oobCode,
 * and delivers a branded magic link email via Resend.
 * No password required — the oobCode is the credential.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendMagicLinkEmail } from '@/lib/email/magic-link';

// In-memory rate limiter: 1 request per email+app_id per 60s
const rateLimitMap = new Map<string, number>();

function checkRateLimit(key: string): { allowed: boolean; waitSeconds: number } {
  const now = Date.now();
  const lastSent = rateLimitMap.get(key);

  if (lastSent) {
    const elapsed = (now - lastSent) / 1000;
    if (elapsed < 60) {
      return { allowed: false, waitSeconds: Math.ceil(60 - elapsed) };
    }
  }

  rateLimitMap.set(key, now);
  return { allowed: true, waitSeconds: 0 };
}

export async function POST(request: NextRequest) {
  try {
    const { email, nonce, app_id, redirect_uri } = await request.json();

    if (!email || !nonce || !app_id) {
      return NextResponse.json(
        { error: 'Missing email, nonce, or app_id' },
        { status: 400 }
      );
    }

    // Validate app exists
    const adminSupabase = createAdminClient();
    const { data: app, error: appError } = await adminSupabase
      .from('apps')
      .select('id')
      .eq('id', app_id)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: 'Invalid app_id' }, { status: 400 });
    }

    // Rate limit
    const rateLimitKey = `magic-link:${email}:${app_id}`;
    const { allowed, waitSeconds } = checkRateLimit(rateLimitKey);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'rate_limited',
          message: `Please wait ${waitSeconds} seconds before requesting another link.`,
          wait_seconds: waitSeconds,
        },
        { status: 429 }
      );
    }

    // Get or create Firebase user (no password — magic link is the credential)
    let uid: string;
    try {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        const created = await auth.createUser({ email });
        uid = created.uid;
      } else {
        throw err;
      }
    }

    // Generate Firebase sign-in link to obtain the oobCode
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://cavos.xyz';
    const firebaseLink = await auth.generateSignInWithEmailLink(email, {
      url: baseUrl,
      handleCodeInApp: false,
    });

    // Extract oobCode — this is what Firebase REST API uses to verify server-side
    const firebaseUrl = new URL(firebaseLink);
    const oobCode = firebaseUrl.searchParams.get('oobCode');

    if (!oobCode) {
      console.error('[MagicLink] Firebase did not return an oobCode:', firebaseLink);
      return NextResponse.json(
        { error: 'Failed to generate sign-in link' },
        { status: 500 }
      );
    }

    // Build our branded magic link — nonce travels in the URL (it's a hash, not a secret)
    const verifyParams: Record<string, string> = { email, oobCode, nonce, app_id };
    if (redirect_uri) verifyParams.redirect_uri = redirect_uri;
    const magicLink = `${baseUrl}/api/oauth/firebase/magic-link/verify?${new URLSearchParams(verifyParams)}`;

    await sendMagicLinkEmail(email, magicLink, app_id);

    console.log(`[MagicLink] Link sent to ${email} (uid: ${uid}) for app ${app_id}`);

    return NextResponse.json({ status: 'sent', email });
  } catch (error: any) {
    console.error('[MagicLink] Request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send magic link' },
      { status: 500 }
    );
  }
}
