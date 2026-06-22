import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ContactSalesData {
  workEmail: string;
  region: string;
  firstName: string;
  lastName: string;
  dialCode: string;
  phone: string;
  companyWebsite: string;
  jobLevel: string;
  jobFunction: string;
  telegram?: string;
  xHandle?: string;
}

function row(label: string, value?: string): string {
  if (!value) return '';
  return `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #ECECF0;color:#6B6B76;font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #ECECF0;color:#0A0A0F;font-size:13px;font-weight:500;">${escapeHtml(value)}</td>
    </tr>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendContactSalesEmail(data: ContactSalesData): Promise<void> {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const phone = `${data.dialCode} ${data.phone}`.trim();

  const subject = `New sales inquiry — ${fullName || data.workEmail}`;

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background-color:#F7F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border:1px solid #ECECF0;border-radius:10px;overflow:hidden;">
          <div style="padding:24px 24px 8px 24px;">
            <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:-0.01em;color:#402AFF;font-weight:600;">CONTACT SALES</p>
            <h1 style="margin:0;font-size:20px;font-weight:600;color:#0A0A0F;letter-spacing:-0.02em;">${escapeHtml(fullName || data.workEmail)}</h1>
            <p style="margin:6px 0 0 0;font-size:13px;color:#6B6B76;">Submitted via cavos.xyz/contact-sales</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            ${row('Work email', data.workEmail)}
            ${row('Region', data.region)}
            ${row('Name', fullName)}
            ${row('Phone', phone)}
            ${row('Company website', data.companyWebsite)}
            ${row('Job level', data.jobLevel)}
            ${row('Job function', data.jobFunction)}
            ${row('Telegram', data.telegram)}
            ${row('X / Twitter', data.xHandle)}
          </table>
        </div>
        <p style="margin:16px 0 0 0;text-align:center;font-size:11px;color:#9999A0;">Reply directly to this email to reach ${escapeHtml(fullName || 'the lead')}.</p>
      </div>
    </body>
  </html>`;

  const textContent = `New sales inquiry — ${fullName || data.workEmail}
Submitted via cavos.xyz/contact-sales

Work email:      ${data.workEmail}
Region:          ${data.region}
Name:            ${fullName}
Phone:           ${phone}
Company website: ${data.companyWebsite}
Job level:       ${data.jobLevel}
Job function:    ${data.jobFunction}
Telegram:        ${data.telegram || '—'}
X / Twitter:     ${data.xHandle || '—'}
`;

  try {
    await resend.emails.send({
      from: 'Cavos Contact Sales <noreply@cavos.xyz>',
      to: 'adrianvrj@cavos.xyz',
      reply_to: data.workEmail,
      subject,
      html: htmlContent,
      text: textContent,
    });
    console.log(`[Email] Contact-sales inquiry sent from ${data.workEmail}`);
  } catch (error) {
    console.error('[Email] Failed to send contact-sales email:', error);
    throw new Error('Failed to send contact-sales email');
  }
}
