import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  token: string,
  appId: string
): Promise<void> {
  try {
    // Fetch app details including email customization
    const adminSupabase = createAdminClient();
    const { data: app } = await adminSupabase
      .from('apps')
      .select('name, logo_url, email_reply_to, email_from_name, email_template_html')
      .eq('id', appId)
      .single();

    const appName = app?.name || 'Cavos Application';
    const appLogo = app?.logo_url;
    const verificationUrl = `${
      process.env.NEXT_PUBLIC_URL || 'https://cavos.xyz'
    }/api/oauth/firebase/verify-email?token=${token}`;

    // Email configuration - always send from Cavos verified domain
    const fromAddress = 'noreply@cavos.xyz';
    const fromName = app?.email_from_name || appName;
    const replyTo = app?.email_reply_to || undefined;

    // Use custom template if provided, otherwise use default
    let htmlContent = app?.email_template_html;

    if (htmlContent) {
      // Replace placeholders in custom template
      htmlContent = htmlContent
        .replace(/\{\{verification_url\}\}/g, verificationUrl)
        .replace(/\{\{app_name\}\}/g, appName)
        .replace(/\{\{user_email\}\}/g, email)
        .replace(/\{\{app_logo\}\}/g, appLogo || '');
    } else {
      // Use default template
      htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
            }
            .header {
              background-color: #000000;
              padding: 24px;
              text-align: center;
            }
            .header img {
              max-width: 120px;
              height: auto;
            }
            .content {
              padding: 40px 24px;
            }
            h1 {
              font-size: 24px;
              font-weight: 600;
              margin: 0 0 16px 0;
              color: #000000;
            }
            p {
              margin: 0 0 16px 0;
              color: #666666;
            }
            .button {
              display: inline-block;
              background: #000000;
              color: #ffffff;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 8px;
              margin: 24px 0;
              font-weight: 500;
            }
            .button:hover {
              background: #333333;
            }
            .link-fallback {
              margin: 24px 0;
              padding: 16px;
              background-color: #f8f8f8;
              border-radius: 8px;
              word-break: break-all;
              font-size: 12px;
              color: #666666;
            }
            .footer {
              padding: 24px;
              text-align: center;
              color: #999999;
              font-size: 12px;
              border-top: 1px solid #eeeeee;
            }
            .footer p {
              margin: 8px 0;
              color: #999999;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${
                appLogo
                  ? `<img src="${appLogo}" alt="${appName}" />`
                  : `<h2 style="color: #ffffff; margin: 0;">Cavos</h2>`
              }
            </div>
            <div class="content">
              <h1>Verify your email for ${appName}</h1>
              <p>Welcome! To complete your registration and start using ${appName}, please verify your email address.</p>
              <p>Click the button below to confirm your email:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <div class="link-fallback">
                ${verificationUrl}
              </div>
            </div>
            <div class="footer">
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account with ${appName}, you can safely ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} Cavos. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    }

    const textContent = `
Verify your email for ${appName}

Welcome! To complete your registration and start using ${appName}, please verify your email address.

Click this link to verify: ${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with ${appName}, you can safely ignore this email.

© ${new Date().getFullYear()} Cavos. All rights reserved.
    `.trim();

    await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: email,
      reply_to: replyTo,
      subject: `Verify your email for ${appName}`,
      html: htmlContent,
      text: textContent,
    });

    console.log(`[Email] Verification email sent to ${email} for app ${appName}`);
  } catch (error) {
    console.error('[Email] Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}
