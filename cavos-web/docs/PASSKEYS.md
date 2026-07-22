# Backoffice passkeys

The Cavos backoffice uses Supabase Auth's native passkey support. Passkeys are
optional; password login remains available for recovery.

## Production configuration

In the Supabase dashboard, open **Authentication → Passkeys**, enable passkey
authentication, and configure:

- Relying Party Display Name: `Cavos`
- Relying Party ID: `cavos.xyz`
- Relying Party Origins: `https://cavos.xyz`

Do not change the RP ID after users enroll passkeys. Existing credentials are
bound to that RP ID and would stop working.

## Testing

Enroll a passkey while signed in at `https://cavos.xyz/dashboard/settings`, sign
out, and use **Sign in with passkey**. The production RP configuration cannot be
tested from `http://localhost:3000`, because `localhost` is not within the
`cavos.xyz` relying-party domain.

Supabase currently marks this API as experimental. Keep password recovery
enabled and review SDK release notes before upgrading `@supabase/supabase-js`.
