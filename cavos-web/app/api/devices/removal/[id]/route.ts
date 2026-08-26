/**
 * GET /api/devices/removal/[id]
 * Fetch a standing device-revocation request — the target of the "this wasn't
 * me" link in the device-added email. Returns only what the app's revocation
 * page needs to rebuild the identity context and name the device; no PII, no
 * secrets. Reading this grants nothing: the revocation is an on-chain
 * `remove_signer` signed by a device that is already authorized.
 *
 * NOTE: app_salt is no longer served on this unauthenticated route.
 * The integrating app's revocation page must use the appSalt it already has
 * configured in the kit client.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { ApiLogger } from '@/lib/api/logger';
import { ApiResponse } from '@/lib/api/response';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = ApiLogger.createRequestLogger('/api/devices/removal/[id]', 'GET');

  try {
    const { id } = await params;
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('device_removal_requests')
      .select('id, app_id, target_pub_x, target_pub_y, device_label, status, expires_at, created_at, wallets(address, network)')
      .eq('id', id)
      .single();

    if (error || !data) {
      logger.info('Removal request not found', { id });
      return ApiResponse.success({ found: false });
    }

    const expired =
      data.status === 'expired' || new Date(data.expires_at).getTime() < Date.now();

    const wallet = (data.wallets as { address: string; network: string }[] | null)?.[0] ?? null;

    logger.complete(true);
    return ApiResponse.success({
      found: true,
      request_id: data.id,
      app_id: data.app_id,
      wallet_address: wallet?.address ?? null,
      network: wallet?.network ?? null,
      target_pub_x: data.target_pub_x,
      target_pub_y: data.target_pub_y,
      device_label: data.device_label,
      status: expired ? 'expired' : data.status,
      expires_at: data.expires_at,
      created_at: data.created_at,
    });
  } catch (error) {
    logger.error('Unexpected error', error);
    logger.complete(false);
    return ApiResponse.serverError();
  }
}

export async function OPTIONS() {
  return ApiResponse.options();
}
