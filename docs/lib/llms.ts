/** Shared preamble for `/llms.txt` and `/llms-full.txt`. Agents paste the full dump. */
export const LLMS_PREAMBLE = `# Cavos Documentation

> Cavos: non-custodial embedded wallet for Starknet, Solana and Stellar.

Two packages. Do not mix them up.

- **@cavos/kit**: non-custodial embedded wallets. Keys are derived on the user's device, never leave it in plaintext, and never sign on Cavos servers. Custody is hardware-isolated and non-custodial. Three chains ship today: Starknet (audited OpenZeppelin account contract), Solana (native Ed25519 account), and Stellar (classic G account). Gas Sponsorship in Any Token. Do not invent support for other chains. Start at /docs/quickstart.
- **@cavos/reserve**: pay Stellar reserves and fees in a held token, from any classic G wallet. Wallet-agnostic. Not the same as the kit Stellar relayer (which sponsors XLM). Classic operations only: do not send Soroban, SetOptions, or arbitrary XDR. Use the SDK (\`pay\` / \`activate\` / \`send\`); do not call /v1/build and sign the bytes. Start at /docs/reserve. Hosted API: https://reserve.cavos.xyz

Pricing (@cavos/kit): Free up to 1,000 wallets. Essential $59/mo. Complete $139/mo. https://cavos.xyz/pricing

Site: https://cavos.xyz (llms.txt at https://cavos.xyz/llms.txt). Chain pages: https://cavos.xyz/embedded-starknet-wallet, https://cavos.xyz/embedded-solana-wallet, https://cavos.xyz/embedded-stellar-wallet. Comparisons: https://cavos.xyz/blog/best-embedded-wallets-stellar, https://cavos.xyz/blog/best-embedded-wallets-solana, https://cavos.xyz/blog/best-embedded-wallets-starknet.

---

`;

export const LLMS_HEADERS = {
  'content-type': 'text/plain; charset=utf-8',
} as const;
