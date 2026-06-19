import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email sent to the wallet owner when a new device requests access. The link
 * points to the integrating app's approval page (apps.device_approval_url or
 * website_url), where an already-registered device signs `add_signer`.
 */
export async function sendDeviceApprovalEmail(
  email: string,
  approveLink: string,
  deviceLabel: string,
  appId: string
): Promise<void> {
  try {
    const adminSupabase = createAdminClient();
    const { data: app } = await adminSupabase
      .from('apps')
      .select('name, logo_url, email_reply_to, email_from_name, email_device_approval_template_html')
      .eq('id', appId)
      .single();

    const appName = app?.name || 'Cavos Application';
    const appLogo = app?.logo_url;

    const fromAddress = 'noreply@cavos.xyz';
    const fromName = app?.email_from_name || appName;
    const replyTo = app?.email_reply_to || undefined;

    const label = deviceLabel || 'a new device';

    let htmlContent = app?.email_device_approval_template_html;

    if (htmlContent) {
      htmlContent = htmlContent
        .replace(/\{\{device_approval_url\}\}/g, approveLink)
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
            .button { display: inline-block; background: #000000; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 24px 0; font-weight: 500; }
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
              <h1>Approve a new device</h1>
              <p>Someone is trying to access your ${appName} wallet from <strong>${label}</strong>. For your security, approve this device from a device you've already signed in on.</p>
              <div style="text-align: center;">
                <a href="${approveLink}" class="button">Approve device</a>
              </div>
              <div class="notice">
                <strong>Open this link on a device that already has access to your wallet.</strong>
                <div class="link-fallback">${approveLink}</div>
              </div>
              <p style="font-size: 13px; color: #999999;">If you didn't request this, you can safely ignore this email — no one can access your wallet without your approval.</p>
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
Approve a new device for ${appName}

Someone is trying to access your wallet from ${label}. Approve this device from a device you've already signed in on.

${approveLink}

If you didn't request this, you can safely ignore this email.

Secured by Cavos — https://cavos.xyz
© ${new Date().getFullYear()} Cavos. All rights reserved.
    `.trim();

    await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: email,
      reply_to: replyTo,
      subject: `Approve a new device for ${appName}`,
      html: htmlContent,
      text: textContent,
    });

    console.log(`[Email] Device approval sent to ${email} for app ${appName}`);
  } catch (error) {
    console.error('[Email] Failed to send device approval email:', error);
    throw new Error('Failed to send device approval email');
  }
}
