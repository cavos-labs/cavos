import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email sent to the wallet owner AFTER a device has been authorized — the
 * counterpart to `sendDeviceApprovalEmail`, which asks permission beforehand.
 *
 * It exists because not every path into a wallet passes through that prompt: a
 * recovery code, a passkey approval from an unfamiliar browser, or a relayed
 * social-recovery wrap can all authorize a device without the owner clicking
 * anything. This is the message that tells them it happened, and the link is
 * their way out. The link opens the integrating app's revocation page, where a
 * device that is ALREADY authorized signs `remove_signer` — the link alone
 * revokes nothing.
 */
export async function sendDeviceAddedEmail(
  email: string,
  revokeLink: string,
  deviceLabel: string,
  appId: string
): Promise<void> {
  try {
    const adminSupabase = createAdminClient();
    const { data: app } = await adminSupabase
      .from('apps')
      .select('name, logo_url, email_reply_to, email_from_name, email_device_added_template_html')
      .eq('id', appId)
      .single();

    const appName = app?.name || 'Cavos Application';
    const appLogo = app?.logo_url;

    const fromAddress = 'noreply@cavos.xyz';
    const fromName = app?.email_from_name || appName;
    const replyTo = app?.email_reply_to || undefined;

    const label = deviceLabel || 'a new device';
    const when = new Date().toUTCString();

    let htmlContent = app?.email_device_added_template_html;

    if (htmlContent) {
      htmlContent = htmlContent
        .replace(/\{\{device_revoke_url\}\}/g, revokeLink)
        .replace(/\{\{device_name\}\}/g, label)
        .replace(/\{\{app_name\}\}/g, appName)
        .replace(/\{\{user_email\}\}/g, email)
        .replace(/\{\{app_logo\}\}/g, appLogo || '');
    } else {
      htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #000000; padding: 24px; text-align: center; }
            .header img { max-width: 120px; height: auto; }
            .content { padding: 40px 24px; }
            h1 { font-size: 24px; font-weight: 600; margin: 0 0 16px 0; color: #000000; }
            p { margin: 0 0 16px 0; color: #666666; }
            .device { margin: 24px 0; padding: 16px; background-color: #f8f8f8; border-radius: 8px; font-size: 14px; color: #333333; }
            .device strong { display: block; margin-bottom: 4px; color: #000000; }
            .button { display: inline-block; background: #b00020; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 8px 0 24px; font-weight: 500; }
            .notice { margin: 24px 0 0; padding: 16px; background-color: #f8f8f8; border-radius: 8px; font-size: 13px; color: #888888; }
            .link-fallback { margin: 8px 0 0; word-break: break-all; font-size: 12px; color: #aaaaaa; }
            .footer { padding: 24px; text-align: center; color: #999999; font-size: 12px; border-top: 1px solid #eeeeee; }
            .footer p { margin: 8px 0; color: #999999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${appLogo ? `<img src="${appLogo}" alt="${appName}" />` : `<h2 style="color: #ffffff; margin: 0;">Cavos</h2>`}
            </div>
            <div class="content">
              <h1>A new device can now access your wallet</h1>
              <p>A device was authorized on your ${appName} wallet. If that was you, nothing else is needed.</p>
              <div class="device">
                <strong>${label}</strong>
                Authorized ${when}
              </div>
              <p><strong>If this wasn't you, revoke it now.</strong></p>
              <div style="text-align: center;">
                <a href="${revokeLink}" class="button">Revoke this device</a>
              </div>
              <div class="notice">
                <strong>Open this link on a device that already has access to your wallet.</strong>
                Revoking is signed by one of your own devices — no one, including ${appName} or Cavos, can do it for you.
                <div class="link-fallback">${revokeLink}</div>
              </div>
            </div>
            <div class="footer">
              <p>Secured by <a href="https://cavos.xyz" style="color: #999999;">Cavos</a></p>
              <p>&copy; ${new Date().getFullYear()} Cavos. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    }

    const textContent = `
A new device can now access your ${appName} wallet

Device: ${label}
Authorized: ${when}

If that was you, nothing else is needed.

If this wasn't you, revoke it now — open this link on a device that already has access to your wallet:

${revokeLink}

Revoking is signed by one of your own devices; no one else can do it for you.

Secured by Cavos — https://cavos.xyz
© ${new Date().getFullYear()} Cavos. All rights reserved.
    `.trim();

    await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: email,
      reply_to: replyTo,
      subject: `A new device was added to your ${appName} wallet`,
      html: htmlContent,
      text: textContent,
    });

    console.log(`[Email] Device-added notice sent to ${email} for app ${appName}`);
  } catch (error) {
    console.error('[Email] Failed to send device-added email:', error);
    throw new Error('Failed to send device-added email');
  }
}
