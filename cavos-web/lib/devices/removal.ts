import { createAdminClient } from '@/lib/supabase/admin';
import { sendDeviceAddedEmail } from '@/lib/email/device-added';

/**
 * After a device is authorized, create its standing revocation request and mail
 * the owner the "if this wasn't you" link.
 *
 * The row is what the app's `/revoke-device` page reads to know which signer to
 * offer removing. It confers no authority of its own — the revocation is an
 * on-chain `remove_signer` signed by a device that is already authorized — so a
 * leaked link cannot be used to lock anyone out.
 *
 * Callers must treat failures here as non-fatal: the `add_signer` has already
 * landed on-chain by this point.
 */
export async function notifyDeviceAdded(params: {
  appId: string;
  environmentId: string | null;
  walletId: string;
  pubX: string;
  pubY: string;
  deviceLabel: string | null;
  email: string | null;
}): Promise<void> {
  const adminSupabase = createAdminClient();

  // Same destination as the approval flow: Cavos hosts no device pages, each
  // integrating app builds its own route and registers its origin.
  const { data: appRow } = await adminSupabase
    .from('apps')
    .select('device_approval_url, website_url')
    .eq('id', params.appId)
    .single();

  const origin = appRow?.device_approval_url || appRow?.website_url;
  if (!origin) return; // Nowhere to send them; the approval flow already warns.

  // Reuse the standing request for this exact device if one is still open, so
  // repeated confirms don't pile up rows (and old links keep working).
  const { data: existing } = await adminSupabase
    .from('device_removal_requests')
    .select('id, status, expires_at')
    .eq('wallet_id', params.walletId)
    .eq('target_pub_x', params.pubX)
    .eq('target_pub_y', params.pubY)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const reusable = existing && new Date(existing.expires_at).getTime() > Date.now();
  let requestId: string;

  if (reusable) {
    requestId = existing!.id;
  } else {
    const { data: row, error } = await adminSupabase
      .from('device_removal_requests')
      .insert({
        app_id: params.appId,
        environment_id: params.environmentId,
        wallet_id: params.walletId,
        target_pub_x: params.pubX,
        target_pub_y: params.pubY,
        device_label: params.deviceLabel,
      })
      .select('id')
      .single();
    if (error || !row) throw new Error(`failed to create removal request: ${error?.message}`);
    requestId = row.id;
  }

  if (!params.email) return;

  const revokeLink = `${origin.replace(/\/$/, '')}/revoke-device?request=${requestId}`;
  await sendDeviceAddedEmail(params.email, revokeLink, params.deviceLabel ?? '', params.appId);
}
