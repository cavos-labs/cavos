'use client'

import { useState, useEffect, useRef } from 'react'

const CODE_SNIPPET = `const handleApprove = async () => {
  if (!address) return;

  setIsExecuting(true);
  setError(null);
  setTxHash(null);

  try {
    // ERC20 approve call
    const approveCall = {
      contractAddress: TOKEN_ADDRESS,
      entrypoint: 'approve',
      calldata: [
        cavos.getAddress() || "", // spender
        '1000000000000000000', // amount (1 token)
        '0', 
      ],
    };

    const hash = await execute(approveCall, { gasless: true });
    setTxHash(hash);
  } catch (err: any) {
    setError(err.message || 'Transaction failed');
  } finally {
    setIsExecuting(false);
  }
};`

const SYNTAX_COLORS = {
    keyword: 'text-purple-400',
    function: 'text-blue-400',
    string: 'text-green-400',
    comment: 'text-gray-500',
    number: 'text-orange-400',
    default: 'text-gray-300'
}

const highlightCode = (code: string) => {
    const tokens = code.split(/(\/\/.*|\b(?:const|async|await|try|catch|finally|if|return|true|false)\b|'.*?'|".*?"|\b\d+\b|[(){}[\],.;])/g)

    return tokens.map((token, i) => {
        if (!token) return null
        let color = SYNTAX_COLORS.default
        if (token.startsWith('//')) color = SYNTAX_COLORS.comment
        else if (/^(const|async|await|try|catch|finally|if|return|true|false)$/.test(token)) color = SYNTAX_COLORS.keyword
        else if (/^['"]/.test(token)) color = SYNTAX_COLORS.string
        else if (/^\d+$/.test(token)) color = SYNTAX_COLORS.number
        else if (/\b(handleApprove|setIsExecuting|setError|setTxHash|execute|console|log|error|cavos|getAddress)\b/.test(token)) color = SYNTAX_COLORS.function
        return <span key={i} className={color}>{token}</span>
    })
}

export function CodeDemoSection() {
    const [displayedCode, setDisplayedCode] = useState('')
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true)
            },
            { threshold: 0.3 }
        )
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!isVisible) return
        let currentIndex = 0
        const intervalId = setInterval(() => {
            if (currentIndex <= CODE_SNIPPET.length) {
                setDisplayedCode(CODE_SNIPPET.slice(0, currentIndex))
                currentIndex++
            } else {
                clearInterval(intervalId)
            }
        }, 15)
        return () => clearInterval(intervalId)
    }, [isVisible])

    return (
        <div ref={sectionRef} className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 bg-white">
            {/* Left Column: Contextual Text */}
            <div className="flex-1 space-y-6">
                <h3 className="text-4xl font-bold tracking-tight text-black leading-[1.1]">
                    The easiest way to get users into crypto.
                </h3>
                <p className="text-lg text-gray-500 leading-relaxed">
                    Blockchain stays invisible, but the perks are clear. Sign transactions gasless without ever leaving your UI.
                </p>
                <div className="pt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-sm font-medium">
                        <span className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-[10px]">✓</span>
                        Verifiable RSA On-chain
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium">
                        <span className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-[10px]">✓</span>
                        Gasless Execution
                    </div>
                </div>
            </div>

            {/* Right Column: Integrated Code Window */}
            <div className="flex-1 w-full max-w-xl">
                <div className="rounded-[2rem] overflow-hidden bg-[#0a0a0a] shadow-2xl border border-black/5">
                    {/* Window Controls */}
                    <div className="flex items-center gap-2 px-6 py-4 bg-[#111] border-b border-white/5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                    </div>

                    {/* Code Area */}
                    <div className="p-8">
                        <pre className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                            <code>
                                {highlightCode(displayedCode)}
                                <span className="animate-pulse inline-block w-1.5 h-4 bg-primary ml-1 align-middle"></span>
                            </code>
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    )
}
