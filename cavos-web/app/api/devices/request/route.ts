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
      .select('id, wallet_id, new_pub_x, new_pub_y, device_label, status, expires_at, created_at, wallets(address)')
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

    logger.complete(true);
    return ApiResponse.success({
      found: true,
      request_id: data.id,
      wallet_address: (data.wallets as { address: string }[] | null)?.[0]?.address ?? null,
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

    // Reject duplicates: a pending, non-expired request for the same wallet+pubkey.
    const { data: existing } = await adminSupabase
      .from('device_addition_requests')
      .select('id, status, expires_at')
      .eq('wallet_id', wallet.id)
      .eq('new_pub_x', new_pub_x)
      .eq('new_pub_y', new_pub_y)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && existing.status === 'pending' && new Date(existing.expires_at).getTime() > Date.now()) {
      logger.info('Reusing existing pending request', { id: existing.id });
      logger.complete(true);
      return ApiResponse.success({ request_id: existing.id, already_pending: true });
    }

    // Create the request.
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

    // Build the approval link. The app's device-approval URL (or website_url)
    // determines where the owner lands. verifyAppId only returns id/name, so we
    // fetch the origin columns here.
    const { data: appRow } = await adminSupabase
      .from('apps')
      .select('device_approval_url, website_url')
      .eq('id', app_id)
      .single();
    const origin = appRow?.device_approval_url || appRow?.website_url || '';
    const approveLink = origin ? `${origin.replace(/\/$/, '')}/approve-device?request=${reqRow.id}` : '';

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

    logger.info('Device addition request created', { request_id: reqRow.id });
    logger.complete(true);
    return ApiResponse.success({ request_id: reqRow.id, approve_link: approveLink || undefined });
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
