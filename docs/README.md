# Cavos documentation

Public Fumadocs site for `@cavos/kit`, published at
[docs.cavos.xyz](https://docs.cavos.xyz).

The documentation presents Cavos as an every-chain wallet layer while keeping
availability precise: Starknet, Solana, and Stellar are implemented today.
Every new adapter gets its own chain guide, API details, limitations, and
security notes before it is listed as available.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Content

- `content/docs/` — maintained MDX guides and API reference.
- `app/docs/[[...slug]]/` — documentation routes and per-page metadata.
- `app/(home)/` — docs landing page.
- `app/sitemap.ts` and `app/robots.ts` — search discovery.
- `/llms.txt` and `/llms-full.txt` — machine-readable documentation for agents.

Chain-specific pages should remain technically native. Shared pages should use
the unified `Cavos.connect({ chain, network })` model and distinguish current
support from the every-chain roadmap.

## Validate

```bash
npm run lint
npm run build
```
