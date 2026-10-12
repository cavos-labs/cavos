import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(
  email: string,
  otpCode: string,
  appId: string,
  expiresMinutes = 10
): Promise<void> {
  try {
    const adminSupabase = createAdminClient();
    const { data: app } = await adminSupabase
      .from('apps')
      .select('name, logo_url, email_reply_to, email_from_name, email_otp_template_html')
      .eq('id', appId)
      .single();

    const appName = app?.name || 'Cavos Application';
    const appLogo = app?.logo_url;
    const fromAddress = 'noreply@cavos.xyz';
    const fromName = app?.email_from_name || appName;
    const replyTo = app?.email_reply_to || undefined;

    let htmlContent = app?.email_otp_template_html;

    if (htmlContent) {
      htmlContent = htmlContent
        .replace(/\{\{otp_code\}\}/g, otpCode)
        .replace(/\{\{app_name\}\}/g, appName)
        .replace(/\{\{user_email\}\}/g, email)
        .replace(/\{\{app_logo\}\}/g, appLogo || '')
        .replace(/\{\{expires_minutes\}\}/g, String(expiresMinutes));
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
            .code { font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #000000; text-align: center; padding: 18px 20px; background: #f7f7f7; border-radius: 10px; margin: 24px 0; }
            .notice { margin: 24px 0 0; padding: 16px; background-color: #f8f8f8; border-radius: 8px; font-size: 13px; color: #888888; }
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
              <h1>Sign in to ${appName}</h1>
              <p>Enter this verification code to finish signing in.</p>
              <div class="code">${otpCode}</div>
              <div class="notice">
                This code expires in ${expiresMinutes} minutes and can only be used once.
              </div>
              <p style="font-size: 13px; color: #999999;">If you didn't request this, you can safely ignore this email.</p>
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
Sign in to ${appName}

Enter this verification code to finish signing in:

${otpCode}

This code expires in ${expiresMinutes} minutes and can only be used once.

If you didn't request this, you can safely ignore this email.

Secured by Cavos - https://cavos.xyz
© ${new Date().getFullYear()} Cavos. All rights reserved.
    `.trim();

    await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: email,
      reply_to: replyTo,
      subject: `Your ${appName} sign-in code`,
      html: htmlContent,
      text: textContent,
    });

    console.log(`[Email] OTP sent to ${email} for app ${appName}`);
  } catch (error) {
    console.error('[Email] Failed to send OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
}
