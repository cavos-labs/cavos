# Cavos platform

The developer platform behind Cavos' embedded wallets: the dashboard
applications create apps in, the hosted APIs their users' wallets talk to, and
the public documentation.

The wallet SDK itself is not here — it is [`cavos-labs/kit`](https://github.com/cavos-labs/kit).

## What is in here

Three independent applications. Each has its own `package.json`, lockfile,
environment and build, so commands run from the directory, never from the root.

### `cavos-web/`

The marketing site, the developer dashboard, and the hosted API. Everything an
integrator touches that is not the SDK: authentication, organizations, apps and
environments, API keys, chain configuration, usage and billing — and the
endpoints their users' wallets reach at runtime, including the Starknet
paymaster and the Solana and Stellar relayers.

```bash
cd cavos-web && npm install && npm run dev
```

It needs a filled `.env.local`; start from `.env.example`. Tests are split by
area rather than run as one suite:

```bash
npm run test:api            # tokens, wallet rows, recovery commitments
npm run test:stellar-gas    # fee bumps, reserves, key derivation
npm run test:stellar-sep10  # SEP-10 challenge signing
```

### `docs/`

The public documentation at [docs.cavos.xyz](https://docs.cavos.xyz), built with
Fumadocs.

```bash
cd docs && npm install && npm run dev
```

### `confidential-recovery/`

**Orphaned infrastructure, still live.** The recovery service moved to
[`cavos-labs/cavos-recovery`](https://github.com/cavos-labs/cavos-recovery) and
runs in an AWS Nitro Enclave now. What is left here is Terraform for the Google
Cloud resources of the design it replaced: a KMS keyring, two service accounts,
two workload identity pools, an Artifact Registry.

Nothing points at them, but do not tear them down casually — the KMS key sealed
the enrolment records of the old design and destroying it cannot be undone.
Read that directory's README before touching it.

## What lives elsewhere

| Repository | What it is |
| --- | --- |
| [`kit`](https://github.com/cavos-labs/kit) | The SDK: device-native accounts for web and React Native. |
| [`cavos-recovery`](https://github.com/cavos-labs/cavos-recovery) | Hardware-isolated social recovery, running in a Nitro Enclave. |
| [`reserve`](https://github.com/cavos-labs/reserve) | Stellar reserves and fees, paid in a token the user already holds. |

## On which chains are available

Starknet, Solana and Stellar are implemented today. A chain is added through its
own adapter and is not described as available until implementation, security
review and end-to-end validation are all done — the claim is about what ships,
not what is planned.
