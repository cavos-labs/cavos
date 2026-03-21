'use client'

import { useCallback, useState } from 'react'
import { Check, Copy } from 'lucide-react'

/**
 * Colors aligned with Mintlify / One Dark–style fenced blocks (same snippet as docs/web/installation.mdx).
 * Docs repo: ../docs — MDX has no local theme file; highlighting matches hosted docs (One Dark–like).
 */
const SNIPPET = `import { CavosProvider } from '@cavos/react';

const config = {
  appId: 'your-app-id',
  network: 'sepolia', // 'sepolia' | 'mainnet'
  session: {
    defaultPolicy: {
      allowedContracts: ['0x049d...'],       // contracts the session key may call
      spendingLimits: [{ token: '0x049d...', limit: 10n * 10n**18n }],
      maxCallsPerTx: 10
    }
  }
};

export default function App({ children }) {
  return (
    <CavosProvider config={config}>
      {children}
    </CavosProvider>
  );
}`

// One Dark–style (matches typical Mintlify / VS Code doc blocks)
const kw = 'text-[#c678dd]' // import, const, export, function, return…
const str = 'text-[#d19a66]' // string literals
const id = 'text-[#61afef]' // identifiers, keys, numbers (same blue as docs screenshot)
const jsxTag = 'text-[#56b6c2]' // JSX tag names (<CavosProvider />)
const comment = 'text-[#6a9955]'
const punct = 'text-[#abb2bf]' // punctuation & operators
const num = id // numbers use same blue as identifiers (docs screenshot)

export function CavosProviderCodeBlock() {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SNIPPET)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }, [])

  return (
    <div className="relative rounded-xl border border-[#30363d] bg-[#0D1117] shadow-xl shadow-black/25">
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className="absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/6 text-[#abb2bf]/80 transition-colors hover:bg-white/10 hover:text-[#abb2bf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#61afef]/40"
      >
        {copied ? <Check className="h-4 w-4 text-[#98c379]" /> : <Copy className="h-4 w-4" />}
      </button>

      <pre className="overflow-x-auto p-4 pt-12 pr-14 font-mono text-[11px] leading-[1.65] sm:text-[12px] [tab-size:2] [scrollbar-color:#30363d_transparent]">
        <code>
          <span className={kw}>import</span>
          {' '}
          <span className={punct}>{'{'}</span>
          <span className={id}> CavosProvider </span>
          <span className={punct}>{'}'}</span>
          {' '}
          <span className={kw}>from</span>
          {' '}
          <span className={str}>{'\'@cavos/react\''}</span>
          <span className={punct}>;</span>
          {'\n\n'}
          <span className={kw}>const</span>
          {' '}
          <span className={id}>config</span>
          {' '}
          <span className={punct}>=</span>
          {' '}
          <span className={punct}>{'{'}</span>
          {'\n  '}
          <span className={id}>appId</span>
          <span className={punct}>: </span>
          <span className={str}>{'\'your-app-id\''}</span>
          <span className={punct}>,</span>
          {'\n  '}
          <span className={id}>network</span>
          <span className={punct}>: </span>
          <span className={str}>{'\'sepolia\''}</span>
          <span className={punct}>, </span>
          <span className={comment}>{"// 'sepolia' | 'mainnet'"}</span>
          {'\n  '}
          <span className={id}>session</span>
          <span className={punct}>: </span>
          <span className={punct}>{'{'}</span>
          {'\n    '}
          <span className={id}>defaultPolicy</span>
          <span className={punct}>: </span>
          <span className={punct}>{'{'}</span>
          {'\n      '}
          <span className={id}>allowedContracts</span>
          <span className={punct}>: </span>
          <span className={punct}>[</span>
          <span className={str}>{'\'0x049d...\''}</span>
          <span className={punct}>]</span>
          <span className={punct}>,       </span>
          <span className={comment}>{'// contracts the session key may call'}</span>
          {'\n      '}
          <span className={id}>spendingLimits</span>
          <span className={punct}>: </span>
          <span className={punct}>[</span>
          <span className={punct}>{'{'}</span>
          {' '}
          <span className={id}>token</span>
          <span className={punct}>: </span>
          <span className={str}>{'\'0x049d...\''}</span>
          <span className={punct}>, </span>
          <span className={id}>limit</span>
          <span className={punct}>: </span>
          <span className={num}>10n</span>
          <span className={punct}> * </span>
          <span className={num}>10n</span>
          <span className={punct}>**</span>
          <span className={num}>18n</span>
          {' '}
          <span className={punct}>{'}'}</span>
          <span className={punct}>]</span>
          <span className={punct}>,</span>
          {'\n      '}
          <span className={id}>maxCallsPerTx</span>
          <span className={punct}>: </span>
          <span className={num}>10</span>
          {'\n    '}
          <span className={punct}>{'}'}</span>
          {'\n  '}
          <span className={punct}>{'}'}</span>
          {'\n'}
          <span className={punct}>{'}'}</span>
          <span className={punct}>;</span>
          {'\n\n'}
          <span className={kw}>export</span>
          {' '}
          <span className={kw}>default</span>
          {' '}
          <span className={kw}>function</span>
          {' '}
          <span className={id}>App</span>
          <span className={punct}>(</span>
          <span className={punct}>{'{'}</span>
          {' '}
          <span className={id}>children</span>
          {' '}
          <span className={punct}>{'}'}</span>
          <span className={punct}>)</span>
          {' '}
          <span className={punct}>{'{'}</span>
          {'\n  '}
          <span className={kw}>return</span>
          {' '}
          <span className={punct}>(</span>
          {'\n    '}
          <span className={punct}>&lt;</span>
          <span className={jsxTag}>CavosProvider</span>
          {' '}
          <span className={id}>config</span>
          <span className={punct}>=</span>
          <span className={punct}>{'{'}</span>
          <span className={id}>config</span>
          <span className={punct}>{'}'}</span>
          <span className={punct}>&gt;</span>
          {'\n      '}
          <span className={punct}>{'{'}</span>
          <span className={id}>children</span>
          <span className={punct}>{'}'}</span>
          {'\n    '}
          <span className={punct}>&lt;/</span>
          <span className={jsxTag}>CavosProvider</span>
          <span className={punct}>&gt;</span>
          {'\n  '}
          <span className={punct}>)</span>
          <span className={punct}>;</span>
          {'\n'}
          <span className={punct}>{'}'}</span>
        </code>
      </pre>
    </div>
  )
}
