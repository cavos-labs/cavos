# Cavos platform

Nested repository containing the Cavos developer platform and public
documentation:

- `cavos-web/` — marketing site, developer dashboard, hosted API, sponsorship,
  billing, and operational tooling.
- `docs/` — public `@cavos/kit` documentation at
  [docs.cavos.xyz](https://docs.cavos.xyz).

Cavos is building one device-native wallet layer for every chain. Starknet,
Solana, and Stellar are available today; future chains are added through
chain-native adapters and are not described as shipped until implementation,
security review, and end-to-end validation are complete.

Each application has its own `package.json`, lockfile, environment, and build.
Run commands from the relevant directory.
