import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

function safeNext(value: string | null): string {
    return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard'
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = safeNext(searchParams.get('next'))

    const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
    const base =
        process.env.NODE_ENV !== 'development' && forwardedHost ? `https://${forwardedHost}` : origin

    const toLogin = (params: Record<string, string>) =>
        NextResponse.redirect(`${base}/login?${new URLSearchParams({ ...params, next })}`)

    // Supabase reports a failed verification (expired or reused link) here.
    const providerError = searchParams.get('error_description') ?? searchParams.get('error')
    if (providerError) return toLogin({ error: providerError })

    const supabase = await createClient()

    // An email template that links with a token hash verifies on any device.
    if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
        return error ? toLogin({ error: error.message }) : NextResponse.redirect(`${base}${next}`)
    }

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) return NextResponse.redirect(`${base}${next}`)
        // The PKCE verifier lives in the browser that signed up. Opened
        // anywhere else the exchange fails, but Supabase confirmed the email
        // before redirecting here: the account is fine, it just needs a login.
        return toLogin({ verified: '1' })
    }

    return toLogin({ error: 'This confirmation link is incomplete. Request a new one by signing up again.' })
}
