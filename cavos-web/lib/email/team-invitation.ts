import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function sendTeamInvitationEmail(input: { email: string; organizationName: string; role: string; acceptUrl: string }) {
  if (!process.env.RESEND_API_KEY) throw new Error('Email provider is not configured')
  const organization = escapeHtml(input.organizationName)
  const url = escapeHtml(input.acceptUrl)
  await resend.emails.send({
    from: 'Cavos <noreply@cavos.xyz>',
    to: input.email,
    subject: `Join ${input.organizationName} on Cavos`,
    html: `<div style="max-width:560px;margin:32px auto;padding:32px;border:1px solid #ECECF0;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0A0A0F"><p style="margin:0 0 8px;color:#402AFF;font-size:12px;font-weight:700;letter-spacing:.08em">CAVOS TEAM</p><h1 style="margin:0;font-size:22px">Join ${organization}</h1><p style="margin:16px 0;color:#555561;line-height:1.6">You were invited to join as <strong>${escapeHtml(input.role)}</strong>. Sign in with this email address to accept the invitation.</p><a href="${url}" style="display:inline-block;margin:8px 0 20px;padding:11px 18px;border-radius:8px;background:#0A0A0F;color:white;text-decoration:none;font-weight:600">Accept invitation</a><p style="margin:0;color:#6B6B76;font-size:12px;word-break:break-all">This invitation expires in 7 days.<br>${url}</p></div>`,
    text: `Join ${input.organizationName} on Cavos as ${input.role}.\n\n${input.acceptUrl}\n\nThis invitation expires in 7 days.`,
  })
}
