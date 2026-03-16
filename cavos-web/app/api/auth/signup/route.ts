import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const DPA_VERSION = '1.0'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password, full_name, dpa_accepted } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || null,
        },
      },
    })

    if (error) {
      console.error('Supabase signup error:', error)
      return NextResponse.json({
        error: error.message,
        details: error
      }, { status: 400 })
    }

    // Record DPA acceptance with timestamp
    if (dpa_accepted && data.user) {
      const adminSupabase = createAdminClient()
      await adminSupabase
        .from('profiles')
        .update({
          dpa_accepted_at: new Date().toISOString(),
          dpa_version: DPA_VERSION,
        })
        .eq('id', data.user.id)
    }

    return NextResponse.json(
      {
        user: data.user,
        session: data.session,
        message: 'Please check your email to confirm your account',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
