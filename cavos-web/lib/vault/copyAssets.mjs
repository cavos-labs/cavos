// Copies the vault scripts out of @cavos/kit so /vault serves nothing but them.
import { copyFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const source = path.join(path.dirname(require.resolve('@cavos/kit')), 'vault-browser')
const target = path.join(process.cwd(), 'public', 'vault')

await mkdir(target, { recursive: true })
try {
  await copyFile(path.join(source, 'vault-host.global.js'), path.join(target, 'host.js'))
  await copyFile(path.join(source, 'vault-confirm.global.js'), path.join(target, 'confirm.js'))
} catch {
  console.warn('[vault] this @cavos/kit has no vault build; /vault will not work until it is upgraded')
}
