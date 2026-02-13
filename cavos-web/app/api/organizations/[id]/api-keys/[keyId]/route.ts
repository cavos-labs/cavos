import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// DELETE /api/organizations/[id]/api-keys/[keyId] — revoke an API key
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  try {
    const { id: orgId, keyId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // RLS policy ensures the user owns the org — delete will fail silently if not
    const { error } = await supabase
      .from('organization_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('org_id', orgId) // extra safety: scope to org

    if (error) {
      console.error('Error revoking api key:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}