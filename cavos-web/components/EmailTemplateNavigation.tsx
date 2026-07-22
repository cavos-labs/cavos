'use client'

import Link from 'next/link'
import { MobileNavigationMenu } from '@/components/MobileNavigationMenu'

export type EmailTemplateKey = 'verification' | 'magic-link' | 'otp' | 'password-reset' | 'device-approval'

const templates: { key: EmailTemplateKey; label: string; description: string; path: string }[] = [
  { key: 'verification', label: 'Verification', description: 'Confirm new accounts', path: '' },
  { key: 'magic-link', label: 'Magic link', description: 'Passwordless sign-in', path: '/magic-link' },
  { key: 'otp', label: 'OTP', description: 'One-time login code', path: '/otp' },
  { key: 'password-reset', label: 'Password reset', description: 'Recover access', path: '/password-reset' },
  { key: 'device-approval', label: 'Device approval', description: 'Authorize a new device', path: '/device-approval' },
]

export function EmailTemplateNavigation({ appId, active }: { appId: string; active: EmailTemplateKey }) {
  const mobileItems = templates.map((template) => ({ href: `/dashboard/apps/${appId}/emails${template.path}`, label: template.label, description: template.description, active: template.key === active }))
  return (
    <>
    <MobileNavigationMenu label="Email template" items={mobileItems} />
    <nav aria-label="Email templates" className="email-template-nav hidden overflow-x-auto rounded-xl border border-black/10 bg-white p-1.5 sm:block">
      <ul className="flex min-w-max snap-x snap-mandatory gap-1">
        {templates.map((template) => {
          const selected = template.key === active
          return (
            <li key={template.key} className="snap-start">
              <Link
                href={`/dashboard/apps/${appId}/emails${template.path}`}
                aria-current={selected ? 'page' : undefined}
                className={`block rounded-lg px-3 py-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${selected ? 'bg-brand text-white shadow-sm shadow-brand/20' : 'text-black/60 hover:bg-brand-soft hover:text-brand'}`}
              >
                <span className="block text-xs font-semibold">{template.label}</span>
                <span className={`block text-[10px] ${selected ? 'text-white/65' : 'text-black/40'}`}>{template.description}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
    </>
  )
}
