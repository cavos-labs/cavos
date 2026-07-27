# Cavos developer platform

The public website, developer dashboard, and hosted API for Cavos' every-chain
embedded wallet infrastructure.

Cavos gives applications a stable integration surface while each blockchain
keeps its native account, signing, execution, and sponsorship model. Starknet,
Solana, and Stellar are available today. New adapters are only presented as
available after implementation, security review, and end-to-end validation.

## Product surfaces

- Marketing pages and technical comparison content.
- Developer authentication, organizations, apps, and environments.
- API keys, callback URLs, chain configuration, and Solana program allowlists.
- Hosted end-user authentication and wallet registry services.
- Starknet paymaster and Solana/Stellar relayer endpoints.
- Usage, billing, webhooks, and operational controls.
- Blog and links to the public documentation at
  [docs.cavos.xyz](https://docs.cavos.xyz).

## Stack

- Next.js 16 and React 19
- TypeScript and Tailwind CSS v4
- Supabase for developer identity and product data
- Auth0/hosted OAuth compatibility for end-user authentication
- Onvo for subscriptions
- `@cavos/kit` for the current wallet model

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The tracked `.env.example` documents variable names with empty placeholders.
Never put real production credentials in that file or commit a populated `.env.local`.
Database changes live under `supabase/migrations/`.

## Validate

```bash
npm run lint
npm run build
```

## Repository boundaries

This application is part of the nested `cavos/` git repository. The public docs
site is a sibling at `../docs/`. The SDK source lives outside this repository at
`../../kit/` and is consumed through a packed local tarball during workspace
development.

## Product language

Use **every-chain** or **multichain infrastructure** for the product direction,
then name the adapters available today: **Starknet, Solana, and Stellar**. Do not
describe roadmap chains as shipped, and do not use the legacy JWT/RSA
architecture to explain new integrations.

Private software. Copyright Cavos.
