import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  issuedByEnclave,
  readEnclaveReleases,
  retiredEnclaveUrls,
  signInUrl,
  supersedes,
} from './releases'

const CURRENT = 'https://enclave.example'
const RETIRED = 'https://v4.enclave.example'

describe('readEnclaveReleases', () => {
  it('takes every record to the one enclave while releases are not tracked', () => {
    const releases = readEnclaveReleases({ CAVOS_RECOVERY_ENCLAVE_URL: CURRENT })
    assert.equal(releases.current, null)
    assert.equal(releases.urlOf(null), CURRENT)
    assert.equal(releases.urlOf(4), null)
  })

  it('takes a record to the release that sealed it', () => {
    const releases = readEnclaveReleases({
      CAVOS_RECOVERY_ENCLAVE_URL: CURRENT,
      CAVOS_RECOVERY_ENCLAVE_RELEASE: '5',
      CAVOS_RECOVERY_RETIRED_ENCLAVE_URLS: JSON.stringify({ 4: RETIRED }),
    })
    assert.equal(releases.current, 5)
    assert.equal(releases.urlOf(5), CURRENT)
    assert.equal(releases.urlOf(4), RETIRED)
    assert.equal(releases.urlOf(null), CURRENT)
  })

  it('has nowhere to take a record whose release is not deployed', () => {
    const releases = readEnclaveReleases({
      CAVOS_RECOVERY_ENCLAVE_URL: CURRENT,
      CAVOS_RECOVERY_ENCLAVE_RELEASE: '5',
    })
    assert.equal(releases.urlOf(4), null)
  })

  it('refuses a configuration it cannot route with', () => {
    const base = { CAVOS_RECOVERY_ENCLAVE_URL: CURRENT, CAVOS_RECOVERY_ENCLAVE_RELEASE: '5' }
    assert.throws(() => readEnclaveReleases({}))
    assert.throws(() => readEnclaveReleases({ ...base, CAVOS_RECOVERY_ENCLAVE_RELEASE: 'v5' }))
    assert.throws(() => readEnclaveReleases({ ...base, CAVOS_RECOVERY_ENCLAVE_RELEASE: '0' }))
    for (const retired of ['[]', '{"four":"https://x.example"}', '{"4":"not a url"}', '{"4":4}', '{']) {
      assert.throws(() =>
        readEnclaveReleases({ ...base, CAVOS_RECOVERY_RETIRED_ENCLAVE_URLS: retired }),
      )
    }
    assert.throws(() =>
      readEnclaveReleases({
        ...base,
        CAVOS_RECOVERY_RETIRED_ENCLAVE_URLS: JSON.stringify({ 5: RETIRED }),
      }),
    )
  })
})

describe('supersedes', () => {
  const sealedByFour = { enclave_release: 4, dek_sealed: true }

  it('replaces a sealed DEK from an earlier release', () => {
    assert.equal(supersedes(5, sealedByFour, true), true)
  })

  it('keeps a record of the same or a later release', () => {
    assert.equal(supersedes(4, sealedByFour, true), false)
    assert.equal(supersedes(3, sealedByFour, true), false)
  })

  it('keeps a record that carries an on-chain authority', () => {
    assert.equal(supersedes(5, { enclave_release: 4, dek_sealed: false }, true), false)
    assert.equal(supersedes(5, sealedByFour, false), false)
  })

  it('keeps every record while either release is unknown', () => {
    assert.equal(supersedes(null, sealedByFour, true), false)
    assert.equal(supersedes(5, { enclave_release: null, dek_sealed: true }, true), false)
  })
})

describe('signInUrl', () => {
  const releases = readEnclaveReleases({
    CAVOS_RECOVERY_ENCLAVE_URL: CURRENT,
    CAVOS_RECOVERY_ENCLAVE_RELEASE: '5',
    CAVOS_RECOVERY_RETIRED_ENCLAVE_URLS: JSON.stringify({ 4: RETIRED }),
  })

  it('signs in with the current release unless another is named', () => {
    assert.equal(signInUrl(releases, undefined), CURRENT)
    assert.equal(signInUrl(releases, 5), CURRENT)
    assert.equal(signInUrl(releases, 4), RETIRED)
  })

  it('refuses a release that is not deployed, or not a release', () => {
    for (const requested of [3, 0, -4, 4.5, '4', null, {}]) {
      assert.equal(signInUrl(releases, requested), null)
    }
  })
})

describe('issuedByEnclave', () => {
  it('names the providers whose tokens a release signs itself', () => {
    assert.deepEqual(
      ['google', 'apple', 'email', 'github', 'telegram'].filter(issuedByEnclave),
      ['email', 'github', 'telegram'],
    )
  })
})

describe('retiredEnclaveUrls', () => {
  it('lists the relays of the retired releases', () => {
    assert.deepEqual(retiredEnclaveUrls({}), [])
    assert.deepEqual(
      retiredEnclaveUrls({ CAVOS_RECOVERY_RETIRED_ENCLAVE_URLS: JSON.stringify({ 4: RETIRED }) }),
      [RETIRED],
    )
  })
})
