import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseVaultPrivacy, sponsorsPrivacy, toVaultPrivacyConfig } from './privacy'

const enabled = {
  enabled: true,
  sponsor: true,
  prover: 'https://prover.example.com/',
  discovery: 'https://discovery.example.com',
}

test('only enabled networks produce a config', () => {
  const settings = parseVaultPrivacy({ sepolia: enabled, mainnet: { ...enabled, enabled: false } })
  assert.deepEqual(Object.keys(toVaultPrivacyConfig(settings)), ['sepolia'])
})

test('sponsor picks the fee mode and fills Cavos constants', () => {
  const sponsored = toVaultPrivacyConfig(parseVaultPrivacy({ mainnet: enabled })).mainnet!
  assert.deepEqual(sponsored.relay.fee, { mode: 'sponsored', pool_fee: { paid_by: 'sponsor' } })
  assert.equal(sponsored.relay.url, 'https://paymaster.cavos.xyz')
  assert.equal(sponsored.prover, 'https://prover.example.com')
  const own = toVaultPrivacyConfig(parseVaultPrivacy({ sepolia: { ...enabled, sponsor: false } })).sepolia!
  assert.deepEqual(own.relay.fee, {
    mode: 'default',
    gas_token: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  })
})

test('rejects what the vault would refuse', () => {
  assert.throws(() => parseVaultPrivacy({ goerli: enabled }), /not a network/)
  assert.throws(() => parseVaultPrivacy({ sepolia: { ...enabled, prover: 'http://prover.example.com' } }), /https/)
  assert.throws(() => parseVaultPrivacy({ sepolia: { ...enabled, discovery: '' } }), /required/)
  assert.throws(() => parseVaultPrivacy({ sepolia: { ...enabled, extra: 1 } }), /not a known setting/)
  assert.doesNotThrow(() => parseVaultPrivacy({ sepolia: { ...enabled, prover: 'http://localhost:8080' } }))
})

test('a disabled network may keep blank URLs', () => {
  const parsed = parseVaultPrivacy({ sepolia: { enabled: false, sponsor: false, prover: '', discovery: '', rpcUrl: '' } })
  assert.equal(parsed.sepolia?.enabled, false)
})

test('sponsorsPrivacy needs enabled and sponsor on that network, and ignores invalid data', () => {
  const stored = { sepolia: enabled, mainnet: { ...enabled, sponsor: false } }
  assert.equal(sponsorsPrivacy(stored, 'sepolia'), true)
  assert.equal(sponsorsPrivacy(stored, 'mainnet'), false)
  assert.equal(sponsorsPrivacy({ sepolia: { enabled: true, sponsor: true } }, 'sepolia'), false)
  assert.equal(sponsorsPrivacy(null, 'sepolia'), false)
})
