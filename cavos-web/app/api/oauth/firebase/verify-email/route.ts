/**
 * Email Verification Endpoint
 *
 * Validates verification token and marks email as verified for the app
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function redirectToError(message: string): NextResponse {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://cavos.xyz';
  return NextResponse.redirect(
    `${baseUrl}/verification-error?error=${encodeURIComponent(message)}`
  );
}

function redirectToSuccess(email: string, callbackUrl?: string): NextResponse {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://cavos.xyz';
  const defaultSuccessUrl = `${baseUrl}/verification-success?email=${encodeURIComponent(
    email
  )}`;

  if (callbackUrl) {
    return NextResponse.redirect(
      `${callbackUrl}?status=verified&email=${encodeURIComponent(email)}`
    );
  }

  return NextResponse.redirect(defaultSuccessUrl);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return redirectToError('Missing verification token');
    }

    const adminSupabase = createAdminClient();

    // Fetch and validate token
    const { data: tokenData, error: tokenError } = await adminSupabase
      .from('email_verification_tokens')
      .select(
        `
        *,
        app:apps(callback_urls, name)
      `
      )
      .eq('token', token)
      .is('verified_at', null)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token validation error:', tokenError);
      return redirectToError('Invalid or expired verification token');
    }

    // Check expiry
    if (new Date(tokenData.expires_at) < new Date()) {
      return redirectToError('Verification token has expired');
    }

    // Mark token as verified
    const { error: updateTokenError } = await adminSupabase
      .from('email_verification_tokens')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (updateTokenError) {
      console.error('Failed to update token:', updateTokenError);
      return redirectToError('Failed to verify email');
    }

    // Update/create wallet verification status
    // Note: Wallet might not exist yet, so we update it if it exists
    // During first login, we'll check the verification token if wallet doesn't exist
    const { error: walletError } = await adminSupabase
      .from('wallets')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq('email', tokenData.email)
      .eq('app_id', tokenData.app_id);

    // Don't fail if wallet doesn't exist yet - it will be created on login
    if (walletError) {
      console.log(
        'Wallet not found (will be created on login):',
        walletError.message
      );
    }

    // Redirect to app's callback URL or success page
    const callbackUrls = tokenData.app?.callback_urls || [];
    const callbackUrl = callbackUrls[0];

    return redirectToSuccess(tokenData.email, callbackUrl);
  } catch (error) {
    console.error('Verification error:', error);
    return redirectToError('An error occurred during verification');
  }
}
