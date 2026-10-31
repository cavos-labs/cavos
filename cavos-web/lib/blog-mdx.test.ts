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
})
