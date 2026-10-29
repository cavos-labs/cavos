import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(process.cwd())

function read(relative: string) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8')
}

const HUB = '[embedded wallet](https://cavos.xyz/embedded-wallet)'
const GUIDE = '](https://cavos.xyz/blog/how-to-add-an-embedded-wallet)'
const VS_EXTENSION = '](https://cavos.xyz/blog/embedded-wallet-vs-browser-extension)'

describe('docs SEO', () => {
  it('links overview, quickstart, concepts, and each chain page to the marketing cluster', () => {
    const pages = [
      {
        relative: 'content/docs/index.mdx',
        extras: [
          'https://cavos.xyz/embedded-starknet-wallet',
          'https://cavos.xyz/embedded-solana-wallet',
          'https://cavos.xyz/embedded-stellar-wallet',
        ],
      },
      {
        relative: 'content/docs/quickstart.mdx',
        extras: [
          'https://cavos.xyz/embedded-starknet-wallet',
          'https://cavos.xyz/embedded-solana-wallet',
          'https://cavos.xyz/embedded-stellar-wallet',
        ],
      },
      {
        relative: 'content/docs/concepts.mdx',
        extras: [
          'https://cavos.xyz/embedded-starknet-wallet',
          'https://cavos.xyz/embedded-solana-wallet',
          'https://cavos.xyz/embedded-stellar-wallet',
        ],
      },
      {
        relative: 'content/docs/starknet.mdx',
        extras: ['https://cavos.xyz/embedded-starknet-wallet'],
      },
      {
        relative: 'content/docs/solana.mdx',
        extras: ['https://cavos.xyz/embedded-solana-wallet'],
      },
      {
        relative: 'content/docs/stellar.mdx',
        extras: ['https://cavos.xyz/embedded-stellar-wallet'],
      },
    ] as const

    for (const page of pages) {
      const source = read(page.relative)
      assert.match(source, /\[embedded wallet\]\(https:\/\/cavos\.xyz\/embedded-wallet\)/, `${page.relative} missing hub`)
      assert.match(source, new RegExp(escapeRegExp(GUIDE)), `${page.relative} missing React guide`)
      assert.match(source, new RegExp(escapeRegExp(VS_EXTENSION)), `${page.relative} missing vs-extension guide`)
      for (const href of page.extras) {
        assert.match(source, new RegExp(escapeRegExp(href)), `${page.relative} missing ${href}`)
      }
      assert.doesNotMatch(source, /audited Cavos/)
    }
    assert.equal(HUB.includes('embedded wallet'), true)
  })

  it('gives the docs homepage crawlable in-text links without changing the H1', () => {
    const home = read('app/(home)/page.tsx')
    assert.match(home, /href="https:\/\/cavos\.xyz\/embedded-wallet"/)
    assert.match(home, />\s*embedded wallet\s*</)
    assert.match(home, /href="https:\/\/cavos\.xyz\/embedded-starknet-wallet"/)
    assert.match(home, /href="https:\/\/cavos\.xyz\/embedded-solana-wallet"/)
    assert.match(home, /href="https:\/\/cavos\.xyz\/embedded-stellar-wallet"/)
    assert.match(home, /href="https:\/\/cavos\.xyz\/blog\/how-to-add-an-embedded-wallet"/)
    assert.match(home, /href="https:\/\/cavos\.xyz\/blog\/embedded-wallet-vs-browser-extension"/)
    const homeH1 = home.match(/<h1[\s\S]*?<\/h1>/)
    assert.ok(homeH1)
    assert.doesNotMatch(homeH1[0], /href=/)
  })

  it('documents kit 0.5.0 attestation paths and GitHub login without stale PCR hashes', () => {
    const recovery = read('content/docs/hardware-isolated-recovery.mdx')
    assert.match(recovery, /DEFAULT_SOCIAL_RECOVERY_ATTESTATION/)
    assert.match(recovery, /api\/enclave\/releases/)
    assert.match(recovery, /repositoryId/)
    assert.match(recovery, /cavos-labs\/cavos-recovery/)
    assert.match(recovery, /measurements\.json/)
    assert.match(recovery, /releases\/tag\/v1/)
    assert.match(recovery, /tuf-repo-cdn\.sigstore\.dev/)
    assert.match(recovery, /getGitHubOAuthUrl|login\('github'\)/)
    assert.match(recovery, /https:\/\/cavos\.xyz\/blog\/cavos-kit-0-5-0/)
    assert.doesNotMatch(recovery, /f2f81237/)
    assert.doesNotMatch(recovery, /24ce0009/)
    assert.match(recovery, /socialRecoveryAttestation/)
    assert.match(recovery, /tag-protected/)
    assert.match(recovery, /required\s+reviewers/)
    assert.match(recovery, /not\s+been the production accept path/)
    assert.match(recovery, /not recommended over/)
    assert.match(recovery, /live and tested in production/)

    const auth = read('content/docs/auth.mdx')
    assert.match(auth, /getGitHubOAuthUrl/)
    assert.match(auth, /https:\/\/enclave\.cavos\.xyz\/github/)
    assert.match(auth, /cavos-github/)
    assert.match(auth, /Bring your own GitHub OAuth app/)
    assert.match(auth, /never returned/)
    assert.match(auth, /not recommended over Google, Apple, or email/)

    const api = read('content/docs/api-reference.mdx')
    assert.match(api, /getGitHubOAuthUrl/)
    assert.match(api, /EnclaveReleasePolicy/)
    assert.match(api, /AttestationPolicy/)
  })

  it('adds offers.availability to the docs SoftwareApplication Offer', () => {
    const layout = read('app/layout.tsx')
    assert.match(layout, /'@type': 'SoftwareApplication'/)
    assert.match(layout, /availability:\s*'https:\/\/schema\.org\/InStock'/)
  })
})

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
