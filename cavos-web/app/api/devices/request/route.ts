/**
 * POST /api/devices/request
 * A new device requests access to an existing wallet. Creates a pending
 * device_addition_requests row and emails the wallet owner an approval link.
 * Holds NO keys — approval happens on-chain via add_signer from a registered device.
 *
 * GET /api/devices/request?id=<requestId>
 * Fetch a pending request (for the approving device's UI). Expiry-checked.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { ApiLogger } from '@/lib/api/logger';
import { ApiResponse } from '@/lib/api/response';
import { ApiMiddleware } from '@/lib/api/middleware';
import { sendDeviceApprovalEmail } from '@/lib/email/device-approval';
import { computeAppSalt } from '@/lib/crypto/appSalt';

interface DeviceAdditionRequestBody {
  app_id: string;
  wallet_address: string;
  new_pub_x: string;
  new_pub_y: string;
  device_label?: string;
  /** Owner email to send the approval link to (the SDK has it from login). */
  email?: string;
}

/**
 * GET - fetch a pending device-addition request by id.
 */
export async function GET(request: Request) {
  const logger = ApiLogger.createRequestLogger('/api/devices/request', 'GET');

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return ApiResponse.badRequest('Missing id');
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('device_addition_requests')
      .select('id, wallet_id, app_id, new_pub_x, new_pub_y, device_label, status, expires_at, created_at, wallets(address, network)')
      .eq('id', id)
      .single();

    if (error || !data) {
      logger.info('Request not found', { id });
      return ApiResponse.success({ found: false });
    }

    // Compute effective status (auto-expire).
    const expired =
      data.status === 'expired' ||
      new Date(data.expires_at).getTime() < Date.now();

    // Resolve the per-app salt so the approving page (cavos.xyz/approve-device)
    // can rebuild the SAME identity context (appSalt) the wallet was created
    // under. Without it, the hosted page would derive a different wallet
    // address + device key and never recognize the owner as a signer.
    const baseSalt = process.env.CAVOS_BASE_SALT || '0x0';
    const appSalt = computeAppSalt(data.app_id, baseSalt);
    const walletNetwork = (data.wallets as { address: string; network: string }[] | null)?.[0]?.network ?? null;

    logger.complete(true);
    return ApiResponse.success({
      found: true,
      request_id: data.id,
      app_id: data.app_id,
      wallet_address: (data.wallets as { address: string; network: string }[] | null)?.[0]?.address ?? null,
      network: walletNetwork,
      app_salt: appSalt,
      new_pub_x: data.new_pub_x,
      new_pub_y: data.new_pub_y,
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

/**
 * POST - create a device-addition request and email the owner.
 */
export async function POST(request: Request) {
  const logger = ApiLogger.createRequestLogger('/api/devices/request', 'POST');
  logger.info('Device addition request');

  try {
    const body = await ApiMiddleware.parseBody<DeviceAdditionRequestBody>(request);
    if (!body) {
      return ApiResponse.badRequest('Invalid request body');
    }

    const { app_id, wallet_address, new_pub_x, new_pub_y, device_label, email } = body;
    if (!app_id || !wallet_address || !new_pub_x || !new_pub_y) {
      return ApiResponse.badRequest('Missing required fields', {
        required: ['app_id', 'wallet_address', 'new_pub_x', 'new_pub_y'],
      });
    }

    // Verify app ID.
    const { valid, app } = await ApiMiddleware.verifyAppId(app_id, logger);
    if (!valid) {
      return ApiResponse.unauthorized('Invalid App ID');
    }

    const adminSupabase = createAdminClient();

    // Find the wallet row this request refers to (scoped to the app).
    const { data: wallet, error: walletErr } = await adminSupabase
      .from('wallets')
      .select('id, user_social_id, network')
      .eq('app_id', app_id)
      .eq('address', wallet_address)
      .single();

    if (walletErr || !wallet) {
      logger.warn('Wallet not found for address', { wallet_address });
      return ApiResponse.badRequest('Wallet not found');
    }

    // Reuse a pending, non-expired request for the same wallet+pubkey if one
    // exists; otherwise create a new one. In BOTH cases we (re)send the approval
    // email — a returning user must be able to re-trigger it if the first one
    // never arrived or was dismissed.
    const { data: existing } = await adminSupabase
      .from('device_addition_requests')
      .select('id, status, expires_at')
      .eq('wallet_id', wallet.id)
      .eq('new_pub_x', new_pub_x)
      .eq('new_pub_y', new_pub_y)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const reused =
      existing && existing.status === 'pending' && new Date(existing.expires_at).getTime() > Date.now();
    let requestId: string;

    if (reused) {
      logger.info('Reusing existing pending request', { id: existing!.id });
      requestId = existing!.id;
    } else {
      const { data: reqRow, error: reqErr } = await adminSupabase
        .from('device_addition_requests')
        .insert({
          app_id,
          wallet_id: wallet.id,
          new_pub_x,
          new_pub_y,
          device_label: device_label ?? null,
        })
        .select('id')
        .single();

      if (reqErr || !reqRow) {
        logger.error('Failed to create request', reqErr);
        logger.complete(false);
        return ApiResponse.serverError('Failed to create request');
      }
      requestId = reqRow.id;
    }

    // Build the approval link. The app's device-approval URL (or website_url)
    // determines where the owner lands. verifyAppId only returns id/name, so we
    // fetch the origin columns here.
    const { data: appRow } = await adminSupabase
      .from('apps')
      .select('device_approval_url, website_url')
      .eq('id', app_id)
      .single();
    // Where the owner lands to approve:
    //   1. the app's configured device-approval URL (their own page), else
    //   2. their website_url, else
    //   3. Cavos's own hosted approval page (default — works with zero config).
    // The target page is always at `${origin}/approve-device?request=<id>` —
    // Cavos ships that page at cavos.xyz/approve-device; integrating apps that
    // set device_approval_url must expose the same path.
    const hostedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://cavos.xyz';
    const origin = appRow?.device_approval_url || appRow?.website_url || hostedOrigin;
    const approveLink = `${origin.replace(/\/$/, '')}/approve-device?request=${requestId}`;

    // The owner's email comes from the SDK (it has it from login). The wallet
    // stores a uid/sub, not an email (wallets.email was dropped in the PII
    // cleanup), so the client passes it explicitly.
    const ownerEmail = email ?? null;
    if (ownerEmail) {
      try {
        await sendDeviceApprovalEmail(ownerEmail, approveLink, device_label ?? '', app_id);
      } catch (e) {
        // Non-fatal: the request is created; owner can still approve via a direct link / dashboard.
        logger.warn('Approval email failed', e);
      }
    } else {
      logger.warn('No owner email provided; skipping approval email', { wallet_id: wallet.id });
    }

    logger.info('Device addition request ready', { request_id: requestId, reused: !!reused });
    logger.complete(true);
    return ApiResponse.success({
      request_id: requestId,
      approve_link: approveLink || undefined,
      already_pending: !!reused,
    });
  } catch (error) {
    logger.error('Unexpected error', error);
    logger.complete(false);
    return ApiResponse.serverError();
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return ApiResponse.options();
}
