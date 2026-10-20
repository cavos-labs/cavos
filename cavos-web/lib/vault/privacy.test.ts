import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseVaultPrivacy, sponsorsPrivacy, toVaultPrivacyConfig } from './privacy'

const enabled = { enabled: true, sponsor: true }

test('only enabled networks produce a config', () => {
  const settings = parseVaultPrivacy({ sepolia: enabled, mainnet: { ...enabled, enabled: false } })
  assert.deepEqual(Object.keys(toVaultPrivacyConfig(settings)), ['sepolia'])
})

test('falls back to the StarkWare-hosted services and a spec 0.10 RPC on Sepolia', () => {
  const configs = toVaultPrivacyConfig(parseVaultPrivacy({ sepolia: enabled, mainnet: enabled }))
  assert.equal(configs.sepolia!.prover, 'https://transaction-prover.alpha-sepolia.sw-dev.io')
  assert.equal(configs.sepolia!.discovery, 'https://discovery-service.alpha-sepolia.sw-dev.io')
  assert.equal(configs.sepolia!.rpcUrl, 'https://starknet-sepolia-rpc.publicnode.com')
  assert.equal(configs.mainnet!.prover, 'https://transaction-prover.alpha-mainnet.sw-dev.io')
  assert.equal(configs.mainnet!.discovery, 'https://discovery-service.alpha-mainnet.sw-dev.io')
  assert.equal(configs.mainnet!.rpcUrl, undefined)
})

test('an override replaces the default', () => {
  const config = toVaultPrivacyConfig(
    parseVaultPrivacy({ mainnet: { ...enabled, prover: 'https://prover.example.com/', rpcUrl: '' } }),
  ).mainnet!
  assert.equal(config.prover, 'https://prover.example.com')
  assert.equal(config.discovery, 'https://discovery-service.alpha-mainnet.sw-dev.io')
})

test('sponsor picks the fee mode and fills Cavos constants', () => {
  const sponsored = toVaultPrivacyConfig(parseVaultPrivacy({ mainnet: enabled })).mainnet!
  assert.deepEqual(sponsored.relay.fee, { mode: 'sponsored', pool_fee: { paid_by: 'sponsor' } })
  assert.equal(sponsored.relay.url, 'https://paymaster.cavos.xyz')
  const own = toVaultPrivacyConfig(parseVaultPrivacy({ sepolia: { ...enabled, sponsor: false } })).sepolia!
  assert.deepEqual(own.relay.fee, {
    mode: 'default',
    gas_token: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  })
})

test('rejects what the vault would refuse', () => {
  assert.throws(() => parseVaultPrivacy({ goerli: enabled }), /not a network/)
  assert.throws(() => parseVaultPrivacy({ sepolia: { ...enabled, prover: 'http://prover.example.com' } }), /https/)
  assert.throws(() => parseVaultPrivacy({ sepolia: { ...enabled, extra: 1 } }), /not a known setting/)
  assert.doesNotThrow(() => parseVaultPrivacy({ sepolia: { ...enabled, prover: 'http://localhost:8080' } }))
})

test('sponsorsPrivacy needs enabled and sponsor on that network, and ignores invalid data', () => {
  const stored = { sepolia: enabled, mainnet: { ...enabled, sponsor: false } }
  assert.equal(sponsorsPrivacy(stored, 'sepolia'), true)
  assert.equal(sponsorsPrivacy(stored, 'mainnet'), false)
  assert.equal(sponsorsPrivacy({ sepolia: { enabled: true } }, 'sepolia'), false)
  assert.equal(sponsorsPrivacy(null, 'sepolia'), false)
})
