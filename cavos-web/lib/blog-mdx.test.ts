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


