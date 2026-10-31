import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { getAllPosts, getPostBySlug } from './blog'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

describe('blog MDX compile', () => {
  it('rejects HTML comments that next-mdx-remote cannot parse', () => {
    const files = fs.readdirSync(BLOG_DIR).filter((name) => name.endsWith('.mdx'))
    assert.ok(files.length > 0)
    for (const filename of files) {
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf8')
      assert.doesNotMatch(
        raw,
        /<!--/,
        `${filename} uses <!-- HTML comments; MDX comments are {/* text */}`,
      )
    }
  })

  it('compiles every blog post with next-mdx-remote', async () => {
    // Dynamic import so tsx loads the ESM graph the same way Next does.
    const { serialize } = await import('next-mdx-remote/serialize')
    const posts = getAllPosts()
    assert.ok(posts.length > 0)
    for (const meta of posts) {
      const post = getPostBySlug(meta.slug)
      assert.ok(post, meta.slug)
      // Same compile path as app/blog/[slug]/page.tsx (MDXRemote from rsc
      // calls serialize(source, options, true)).
      await serialize(post.content, {}, true)
    }
  })
})



describe('blog MDX copy rules', () => {
  it('has no em-dashes in any blog post', () => {
    const files = fs.readdirSync(BLOG_DIR).filter((name) => name.endsWith('.mdx'))
    for (const filename of files) {
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf8')
      assert.ok(!raw.includes('\u2014'), `${filename} contains an em-dash`)
    }
  })
})

describe('blog internal links', () => {
  const read = (slug: string) => fs.readFileSync(path.join(BLOG_DIR, `${slug}.mdx`), 'utf8')

  it('links the what-is explainer to chain pages, compare, and Privy alternatives', () => {
    const raw = read('what-is-an-embedded-wallet')
    for (const href of [
      '/embedded-wallet',
      '/embedded-starknet-wallet',
      '/embedded-solana-wallet',
      '/embedded-stellar-wallet',
      '/compare',
      '/privy-alternatives',
    ]) {
      assert.ok(raw.includes(`](${href})`), `what-is-an-embedded-wallet is missing a link to ${href}`)
    }
  })

  it('links guides and comparisons back to the what-is explainer', () => {
    for (const slug of [
      'how-to-add-an-embedded-wallet',
      'embedded-wallet-react-sdk',
      'privy-vs-turnkey',
      'alchemy-vs-privy',
      'gasless-starknet-transactions',
      'stellar-embedded-wallet-tutorial',
    ]) {
      assert.ok(read(slug).includes('](/blog/what-is-an-embedded-wallet)'), `${slug} does not link the explainer`)
    }
  })

  it('links every best-of shortlist to the compare pages', () => {
    for (const slug of ['best-embedded-wallets-starknet', 'best-embedded-wallets-stellar', 'best-embedded-wallets-solana']) {
      assert.ok(read(slug).includes('](/compare'), `${slug} does not link /compare`)
    }
  })

  it('gives every indexable post at least three inbound links from other posts', () => {
    const files = fs.readdirSync(BLOG_DIR).filter((name) => name.endsWith('.mdx'))
    const sources = files.map((name) => [name, fs.readFileSync(path.join(BLOG_DIR, name), 'utf8')] as const)
    for (const name of files) {
      const slug = name.replace(/\.mdx$/, '')
      if (slug === 'v1-1-9-sdk-security') continue
      const inbound = sources.filter(([other, raw]) => other !== name && raw.includes(`](/blog/${slug})`)).length
      assert.ok(inbound >= 3, `${slug} has ${inbound} inbound blog links`)
    }
  })
})

describe('wallet-as-a-service guide', () => {
  const raw = fs.readFileSync(path.join(BLOG_DIR, 'wallet-as-a-service.mdx'), 'utf8')
  const body = raw.split(/^---$/m).slice(2).join('---').trim()

  it('opens with a direct definition', () => {
    const firstParagraph = body.split(/\n\n/)[0]
    assert.match(firstParagraph, /^\*\*Wallet-as-a-service \(WaaS\) is /)
    assert.ok(firstParagraph.includes('](/embedded-wallet)'))
  })

  it('uses the head term in its section headings and keeps a FAQ', () => {
    const h2s = body.match(/^## .+$/gm) ?? []
    assert.ok(h2s.filter((h) => /wallet-as-a-service/i.test(h)).length >= 4, h2s.join('\n'))
    assert.match(raw, /^faq:/m)
  })
})
