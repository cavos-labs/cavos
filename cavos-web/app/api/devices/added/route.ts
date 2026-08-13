/**
 * POST /api/devices/added
 * "A device just became an authorized signer on this wallet." Path-agnostic on
 * purpose: a device can be authorized through the email-approval relay, through
 * a recovery code, or through the hardware-isolated (TEE) social-recovery flow —
 * and the last one never touches `/api/devices/request/[id]/confirm`, because
 * the enclave authorizes it and the client submits the transaction itself.
 *
 * Hooking the "a new device was added" notice to any single flow means the paths
 * that add a device WITHOUT the owner clicking anything — the ones the notice
 * exists for — send nothing. So every flow reports here instead.
 *
 * Records the device in the `wallet_devices` mirror and sends the notice with
 * its revocation link. Idempotent: re-reporting the same device is a no-op that
 * reuses the existing removal request.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { ApiLogger } from '@/lib/api/logger';
import { ApiResponse } from '@/lib/api/response';
import { ApiMiddleware } from '@/lib/api/middleware';
import { recordCavosEvent } from '@/lib/operations/events';
import { notifyDeviceAdded } from '@/lib/devices/removal';

interface AddedBody {
  app_id: string;
  wallet_address: string;
  pub_x: string;
  pub_y: string;
  device_label?: string;
  /** Owner email for the notice. The wallet row stores none (PII). */
  email?: string;
  tx_hash?: string;
  environment_id?: string;
  environment?: 'development' | 'production';
}

export async function POST(request: Request) {
  const logger = ApiLogger.createRequestLogger('/api/devices/added', 'POST');
  logger.info('Device added notice');

  try {
    const body = await ApiMiddleware.parseBody<AddedBody>(request);
    if (!body || !body.app_id || !body.wallet_address || !body.pub_x || !body.pub_y) {
      return ApiResponse.badRequest('Missing required fields', {
        required: ['app_id', 'wallet_address', 'pub_x', 'pub_y'],
      });
    }

    const { valid, app, resolved } = await ApiMiddleware.verifyAppId(
      body.app_id,
      logger,
      body.environment_id ?? body.environment,
    );
    if (!valid || !app || !resolved) {
      return ApiResponse.unauthorized('Invalid App ID');
    }

    const adminSupabase = createAdminClient();
    if (!resolved.environmentId) {
      return ApiResponse.serverError('Production environment is not configured for this app');
    }

    const { data: wallet, error: walletErr } = await adminSupabase
      .from('wallets')
      .select('id, network')
      .eq('app_id', app.id)
      .eq('environment_id', resolved.environmentId)
      .eq('address', body.wallet_address)
      .single();

    if (walletErr || !wallet) {
      logger.warn('Wallet not found for address', { wallet_address: body.wallet_address });
      return ApiResponse.badRequest('Wallet not found');
    }

    // Mirror the signer. The TEE path authorizes on-chain without ever telling
    // the backend, so without this the device would be invisible to the console
    // and to the revocation page.
    const { error: devErr } = await adminSupabase.from('wallet_devices').upsert(
      {
        wallet_id: wallet.id,
        pub_x: body.pub_x,
        pub_y: body.pub_y,
        device_label: body.device_label ?? null,
      },
      { onConflict: 'wallet_id,pub_x,pub_y', ignoreDuplicates: false },
    );
    if (devErr) {
      // Non-fatal: the on-chain state is the source of truth, this is a mirror.
      logger.error('Failed to mirror device', devErr);
    }

    // Best-effort, for the same reason as the addition confirm: the signer is
    // already authorized on-chain, so a mail failure must not fail this call.
    let notified = false;
    try {
      await notifyDeviceAdded({
        appId: app.id,
        environmentId: resolved.environmentId,
        walletId: wallet.id,
        pubX: body.pub_x,
        pubY: body.pub_y,
        deviceLabel: body.device_label ?? null,
        email: body.email ?? null,
      });
      notified = true;
    } catch (e) {
      logger.warn('Device-added notification failed', { error: String(e) });
    }

    await recordCavosEvent({
      appId: app.id,
      environmentId: resolved.environmentId,
      walletId: wallet.id,
      eventType: 'device.added',
      status: 'success',
      requestId: logger.requestId,
      ...(body.tx_hash ? { txReference: body.tx_hash } : {}),
      network: wallet.network,
    });

    logger.complete(true);
    return ApiResponse.success({ success: true, notified });
  } catch (error) {
    logger.error('Unexpected error', error);
    logger.complete(false);
    return ApiResponse.serverError();
  }
}

export async function OPTIONS() {
  return ApiResponse.options();
}
