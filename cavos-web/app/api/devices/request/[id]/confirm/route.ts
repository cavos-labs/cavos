/**
 * POST /api/devices/request/[id]/confirm
 * Called after an already-registered device has signed and submitted
 * add_signer(new_pub_x, new_pub_y) on-chain. Marks the request approved and
 * records the new device as an authorized signer (idempotent).
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { ApiLogger } from '@/lib/api/logger';
import { ApiResponse } from '@/lib/api/response';
import { ApiMiddleware } from '@/lib/api/middleware';
import { recordCavosEvent } from '@/lib/operations/events';

interface ConfirmBody {
  tx_hash: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = ApiLogger.createRequestLogger('/api/devices/request/[id]/confirm', 'POST');
  logger.info('Device addition confirm');

  try {
    const { id } = await params;
    const body = await ApiMiddleware.parseBody<ConfirmBody>(request);
    if (!body || !body.tx_hash) {
      return ApiResponse.badRequest('Missing tx_hash');
    }

    const adminSupabase = createAdminClient();

    const { data: req, error: reqErr } = await adminSupabase
      .from('device_addition_requests')
      .select('id, wallet_id, app_id, environment_id, new_pub_x, new_pub_y, device_label, status, expires_at, wallets(network)')
      .eq('id', id)
      .single();

    if (reqErr || !req) {
      return ApiResponse.badRequest('Request not found');
    }

    // Idempotent: already approved.
    if (req.status === 'approved') {
      logger.info('Request already approved', { id });
      logger.complete(true);
      return ApiResponse.success({ success: true, already_confirmed: true });
    }

    const expired = new Date(req.expires_at).getTime() < Date.now();
    if (expired) {
      return ApiResponse.badRequest('Request expired');
    }

    // Mark approved.
    const { error: updErr } = await adminSupabase
      .from('device_addition_requests')
      .update({
        status: 'approved',
        confirmed_tx_hash: body.tx_hash,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updErr) {
      logger.error('Failed to update request', updErr);
      logger.complete(false);
      return ApiResponse.serverError('Failed to confirm request');
    }

    // Register the new device signer (idempotent on the unique constraint).
    const { error: devErr } = await adminSupabase
      .from('wallet_devices')
      .upsert(
        {
          wallet_id: req.wallet_id,
          pub_x: req.new_pub_x,
          pub_y: req.new_pub_y,
          device_label: req.device_label ?? null,
        },
        { onConflict: 'wallet_id,pub_x,pub_y', ignoreDuplicates: false }
      );

    if (devErr) {
      logger.error('Failed to register device', devErr);
      // Non-fatal: the on-chain add_signer already succeeded; the row is a mirror.
    }

    logger.info('Device addition confirmed', { id });
    await recordCavosEvent({ appId: req.app_id, environmentId: req.environment_id, walletId: req.wallet_id, eventType: 'device.addition_approved', status: 'success', requestId: logger.requestId, txReference: body.tx_hash, network: (req.wallets as { network?: string } | null)?.network });
    logger.complete(true);
    return ApiResponse.success({ success: true });
  } catch (error) {
    logger.error('Unexpected error', error);
    logger.complete(false);
    return ApiResponse.serverError();
  }
}

export async function OPTIONS() {
  return ApiResponse.options();
}
