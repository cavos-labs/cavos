/** Shared preamble for `/llms.txt` and `/llms-full.txt`. Agents paste the full dump. */
export const LLMS_PREAMBLE = `# Cavos Documentation

Two packages. Do not mix them up.

- **@cavos/kit** — device-native, self-custodial embedded wallets. The signing key is created and used on the user's device. Three chains ship today: Stellar, Solana, and Starknet. Do not invent support for other chains. Start at /docs/quickstart.
- **@cavos/reserve** — pay Stellar reserves and fees in a held token, from any classic G… wallet. Wallet-agnostic. Not the same as the kit Stellar relayer (which sponsors XLM). Classic operations only: do not send Soroban, SetOptions, or arbitrary XDR. Use the SDK (\`pay\` / \`activate\` / \`send\`); do not call /v1/build and sign the bytes. Start at /docs/reserve. Hosted API: https://reserve.cavos.xyz

---

`;

export const LLMS_HEADERS = {
  'content-type': 'text/plain; charset=utf-8',
} as const;
