/**
 * POST /api/devices/removal/[id]/confirm
 * Called after an authorized device has signed and submitted
 * remove_signer(target_pub_x, target_pub_y) on-chain. Marks the request revoked
 * and drops the mirrored `wallet_devices` row (idempotent).
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
  const logger = ApiLogger.createRequestLogger('/api/devices/removal/[id]/confirm', 'POST');
  logger.info('Device removal confirm');

  try {
    const { id } = await params;
    const body = await ApiMiddleware.parseBody<ConfirmBody>(request);
    if (!body || !body.tx_hash) {
      return ApiResponse.badRequest('Missing tx_hash');
    }

    const adminSupabase = createAdminClient();

    const { data: req, error: reqErr } = await adminSupabase
      .from('device_removal_requests')
      .select('id, wallet_id, app_id, environment_id, target_pub_x, target_pub_y, status, expires_at, wallets(network)')
      .eq('id', id)
      .single();

    if (reqErr || !req) {
      return ApiResponse.badRequest('Request not found');
    }

    // Idempotent: the link may well be opened twice.
    if (req.status === 'revoked') {
      logger.info('Request already revoked', { id });
      logger.complete(true);
      return ApiResponse.success({ success: true, already_confirmed: true });
    }

    if (new Date(req.expires_at).getTime() < Date.now()) {
      return ApiResponse.badRequest('Request expired');
    }

    const { error: updErr } = await adminSupabase
      .from('device_removal_requests')
      .update({
        status: 'revoked',
        confirmed_tx_hash: body.tx_hash,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updErr) {
      logger.error('Failed to update request', updErr);
      logger.complete(false);
      return ApiResponse.serverError('Failed to confirm removal');
    }

    // Drop the mirrored device row. Non-fatal on error: the on-chain
    // remove_signer is the source of truth, this table only mirrors it.
    const { error: devErr } = await adminSupabase
      .from('wallet_devices')
      .delete()
      .eq('wallet_id', req.wallet_id)
      .eq('pub_x', req.target_pub_x)
      .eq('pub_y', req.target_pub_y);

    if (devErr) {
      logger.error('Failed to drop device row', devErr);
    }

    logger.info('Device removal confirmed', { id });
    await recordCavosEvent({
      appId: req.app_id,
      environmentId: req.environment_id,
      walletId: req.wallet_id,
      eventType: 'device.removed',
      status: 'success',
      requestId: logger.requestId,
      txReference: body.tx_hash,
      network: (req.wallets as { network?: string } | null)?.network,
    });
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
