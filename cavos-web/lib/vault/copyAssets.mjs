// Refreshes /vault's scripts from @cavos/kit when the installed kit has them.
// The committed copies are what ships until the published kit carries a vault build.
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
  console.warn('[vault] installed @cavos/kit has no vault build; keeping the committed scripts')
}
