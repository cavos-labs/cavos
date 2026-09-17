import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { identityCommitmentHex } from './identityCommitment'

describe('identityCommitmentHex', () => {
  const policy = {
    app_id: 'app_123',
    environment_id: 'env_123',
    issuer: 'https://accounts.google.com',
    audience: 'client.apps.googleusercontent.com',
  }

  it('is stable for the same policy and subject', () => {
    assert.equal(
      identityCommitmentHex(policy, 'subject-1'),
      identityCommitmentHex(policy, 'subject-1'),
    )
  })

  it('changes when the subject or app changes', () => {
    const same = identityCommitmentHex(policy, 'subject-1')
    assert.notEqual(same, identityCommitmentHex(policy, 'subject-2'))
    assert.notEqual(
      same,
      identityCommitmentHex({ ...policy, app_id: 'app_456' }, 'subject-1'),
    )
  })

  it('matches the length-prefixed hex shape the enclave stores', () => {
    assert.match(identityCommitmentHex(policy, 'subject-1'), /^0x[0-9a-f]{64}$/)
  })
})
