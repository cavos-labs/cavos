'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/Card'

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
        '1000000000000000000', // amount (1 token with 18 decimals)
        '0', // amount high part
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
    // Simple regex-based highlighting
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

export function CodeDemoSection({ className }: { className?: string }) {
    const [displayedCode, setDisplayedCode] = useState('')
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.3 }
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

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
        }, 20) // Typing speed

        return () => clearInterval(intervalId)
    }, [isVisible])

    return (
        <section ref={sectionRef} className={`w-full flex flex-col justify-center bg-white ${className || ''}`}>
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 w-full">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                    {/* Left Column: Text */}
                    <div className="flex-1 text-center lg:text-left">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-black mb-6">
                            The easiest way to get users into crypto, blockchain stays invisible, but the perks are clear.
                        </h2>
                    </div>

                    {/* Right Column: Code Snippet */}
                    <div className="flex-1 w-full max-w-lg">
                        <div className="rounded-xl overflow-hidden bg-[#1e1e1e] shadow-2xl border border-gray-800 transform scale-95 origin-center">
                            {/* Window Controls */}
                            <div className="flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] border-b border-gray-800">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                            </div>

                            {/* Code Area */}
                            <div className="p-4">
                                <pre className="font-mono text-[10px] sm:text-xs leading-relaxed whitespace-pre-wrap">
                                    <code>
                                        {highlightCode(displayedCode)}
                                        <span className="animate-pulse inline-block w-1.5 h-3 bg-blue-500 ml-1 align-middle"></span>
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
