import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import GithubSlugger from 'github-slugger'

const DIR = path.join(process.cwd(), 'content/docs')
const pages = fs.readdirSync(DIR).filter((f) => f.endsWith('.mdx'))

function stripCode(src: string) {
  return src.replace(/```[\s\S]*?```/g, '')
}

function anchors(src: string) {
  const slugger = new GithubSlugger()
  const out = new Set<string>()
  for (const line of stripCode(src).split('\n')) {
    const m = /^#{1,6}\s+(.+?)\s*$/.exec(line)
    if (m) out.add(slugger.slug(m[1].replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')))
  }
  return out
}

const index = new Map<string, Set<string>>()
for (const f of pages) {
  const slug = f === 'index.mdx' ? '' : f.replace(/\.mdx$/, '')
  index.set(slug, anchors(fs.readFileSync(path.join(DIR, f), 'utf8')))
}

describe('docs internal links', () => {
  it('every /docs link and anchor resolves', () => {
    const broken: string[] = []
    for (const f of pages) {
      const self = f === 'index.mdx' ? '' : f.replace(/\.mdx$/, '')
      const src = stripCode(fs.readFileSync(path.join(DIR, f), 'utf8'))
      const re = /\]\((\/docs(?:\/[^)#\s]*)?|)(#[^)\s]+)?\)|href="(\/docs[^"#]*)(#[^"]+)?"/g
      for (const m of src.matchAll(re)) {
        const p = m[1] ?? m[3]
        const hash = m[2] ?? m[4]
        if (p === undefined && !hash) continue
        if (p === '' && !hash) continue
        const target = p ? p.replace(/^\/docs\/?/, '').replace(/\/$/, '') : self
        const set = index.get(target)
        if (!set) { broken.push(`${f}: ${p}${hash ?? ''}`); continue }
        if (hash && !set.has(decodeURIComponent(hash.slice(1)))) broken.push(`${f}: ${p ?? ''}${hash}`)
      }
    }
    assert.deepEqual(broken, [])
  })

  it('every page is in meta.json and titles/descriptions are unique', () => {
    const meta = JSON.parse(fs.readFileSync(path.join(DIR, 'meta.json'), 'utf8')) as { pages: string[] }
    const listed = new Set(meta.pages.filter((p) => !p.startsWith('---')))
    for (const f of pages) assert.ok(listed.has(f.replace(/\.mdx$/, '')), `${f} missing from meta.json`)
    const titles = new Map<string, string>()
    const descs = new Map<string, string>()
    for (const f of pages) {
      const fm = /^---\n([\s\S]*?)\n---/.exec(fs.readFileSync(path.join(DIR, f), 'utf8'))?.[1] ?? ''
      const t = /^title:\s*(.+)$/m.exec(fm)?.[1]
      const d = /^description:\s*(.+)$/m.exec(fm)?.[1]
      assert.ok(t && d, `${f} needs title and description`)
      assert.ok(!titles.has(t!), `duplicate title ${t} in ${f} and ${titles.get(t!)}`)
      assert.ok(!descs.has(d!), `duplicate description in ${f}`)
      titles.set(t!, f); descs.set(d!, f)
    }
  })
})
