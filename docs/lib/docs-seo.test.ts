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
    assert.doesNotMatch(home, /<h1[\s\S]*href="https:\/\/cavos\.xyz\/embedded-wallet"/)
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
