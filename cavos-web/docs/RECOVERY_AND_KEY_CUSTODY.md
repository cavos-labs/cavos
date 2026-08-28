# Recovery tiers and relayer key custody

Two decisions that keep coming up together, written down so the next discussion
starts from the numbers rather than from memory. Costs are `us-east-1`,
August 2026, and are pulled from live pricing rather than quoted from the docs.

## Where the relayer keys live today

| Chain | Key | Storage | Per-org? |
|---|---|---|---|
| Stellar | `STELLAR_RELAYER_SECRET[_MAINNET\|_TESTNET]` | Vercel env var, plaintext | Yes — each org's `G…` is derived from the master seed via SEP-0005 `m/44'/148'/{index}'` |
| Solana | `SOLANA_RELAYER_SECRET_KEY[_MAINNET\|_DEVNET]` | Vercel env var, plaintext | No — one shared keypair per network; isolation is accounting only |
| Starknet | Paymaster API key | Client bundle (`NEXT_PUBLIC_…`) | Separate hosted service |

Nothing holds a private key in Postgres. `org_stellar_sponsors` stores only
`public_key` and `derivation_index`; the secret is re-derived in process on every
request and never persisted. A full database dump yields no signing material.

The consequence of derivation is worth stating plainly: **one env var
reconstructs every org's sponsor key.** Indices are sequential, so the database
is not even needed. Per-org accounts isolate tenants from *each other*; they do
not isolate anything from Cavos.

## KMS options for the Stellar seed

KMS does support Ed25519 (`ECC_NIST_EDWARDS25519`, `ED25519_SHA_512` with
`MessageType: RAW`), so it can sign Stellar and Solana transactions directly.
What it cannot do is derive: KMS keys are individual and non-extractable, so
SEP-0005 has no equivalent inside it. That constraint drives the options.

KMS protects against key *exfiltration*, not against key *use*. None of these
options change who can sign — Cavos can, in all three. They change whether a
leaked config or a committed file hands the key to someone else.

Pricing: **$1.00 per customer-managed key per month**, plus **$0.15 per 10,000**
asymmetric requests. At 50,000 sponsored transactions a month the request cost is
$0.75, so the number of keys is what matters, not the traffic.

### A — Envelope-encrypt the master seed · **$1/month**

Derivation stays as it is. The seed is stored encrypted and decrypted through KMS
at process start.

Closes the class of failure that has already happened here twice: a secret
sitting somewhere it should not (see "History" below). Does not help against a
compromised runtime, where the seed is in memory by definition.

### B — One KMS key per org · **$1 × orgs per month**

| Orgs | Monthly |
|---|---|
| 10 | $10 |
| 50 | $50 |
| 200 | $200 |
| 1,000 | $1,000 |

Keys never exist outside KMS. Costs abandoning derivation and adding a key ARN
per org. Note KMS enforces a 7-day minimum before a key can be deleted, so
per-org keys are not cheap to clean up after.

### C — Seal the seed to the Nitro enclave · **$1/month**

The recovery enclave already gates its root key on an attested PCR0. The Stellar
seed could be sealed the same way, decryptable only by an attested measurement.

Strongest of the three, and it puts the enclave in the path of every sponsored
transaction. The enclave host currently runs at zero capacity by choice, since no
customer uses enclave recovery yet; coupling the relay to it would mean it has to
run continuously, turning a $25/month optional cost into a mandatory one.

### Recommendation

**A now.** One dollar, no architectural change, and it removes the failure mode
that has actually occurred. **B when a single org's pot is worth more than the
key that protects it** — at today's balances it is not. **C only if the enclave
becomes something that runs continuously anyway.**

## Recovery tiers

Recovery has two independent implementations, and only one of them costs Cavos
anything to run.

### Passkey and recovery code — no Cavos infrastructure

Verified in the SDK:

- Starknet and Solana: `approveDeviceEverywhere([starknet, solana], passkey)` —
  one WebAuthn assertion over a batch challenge (`sha256(concat(leaves))`)
  approves this device on every chain at once, verified on chain.
- Stellar: `CavosStellar.approveThisDeviceWithPasskey(prfOutput)` — a WebAuthn
  PRF output unwraps the DEK held in the account's own `cv:wp` data entries.
- Both chains also carry `approveThisDeviceWithRecovery(code)` against `cv:wr`.

None of these touch a Cavos server. Recovery depends on the user's passkey
provider — which is arguably *more* self-custodial, and notably does not depend
on Cavos infrastructure being alive.

The limit is real: `hasPasskey` describes the **account**, not the device someone
is returning from. A user whose passkey never synced to the machine they are
logging in from has no passkey there, and cross-ecosystem recovery depends on
CTAP hybrid transport being available to them.

### Hardware-isolated enclave — ~$25/month, fixed

| Item | Monthly |
|---|---|
| `c7g.large` spot (100% spot ASG, 5 AZs) | $17–22 |
| Public IPv4 | $3.60 |
| KMS key | $1 |
| **Total** | **~$25** |

This is a **fixed** cost, not a per-customer one. It buys the property that
recovery needs nothing but an OAuth login — no passkey, no code, no prior device.
That is a conversion argument, not a security one: it serves the users who do not
have passkeys or do not understand them.

### What this means commercially

The fixed cost is the whole point. Against one customer at $39/month it consumes
64% of the revenue; across ten it is 6%. A premium tier does not "cover" a fixed
cost — enough customers do.

So the tiers should be sold on what they actually differ in, not on price alone:

- **Passkey tier** — cheaper, near-zero marginal cost, no dependency on Cavos
  infrastructure for recovery. The user must have a passkey and keep access to
  their provider.
- **Enclave tier** — recovery from nothing but a login. Costs real infrastructure,
  and selling it means committing to run a host that is currently switched off
  precisely because no customer needs it yet.

## History

Both of these are why option A is rated as it is, rather than theoretically.

- **2026-06-25** — two Solana relayer keypairs (64-byte secret keys) committed to
  the public `cavos-labs/cavos` repository as `cavos-web/.keys/relayer*.json`.
  Found 2026-08-18. Both had already been rotated out of production and held
  0 SOL and 0.005 devnet SOL respectively, so nothing was lost. `.keys/` was not
  in `.gitignore`.
- **2026-08-17** — a new enclave image was staged to S3 with a PCR0 that the KMS
  key policy does not authorize. Booting the host on 2026-08-18 showed the
  enclave could not unwrap its root sealing key and exited. The authorized image
  was still in S3 under object versioning and was restored; the KMS policy was
  not touched. The host normally runs at zero capacity, so this had no user
  impact — but the next boot would have failed the same way had it not been
  caught.
