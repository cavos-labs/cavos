import Image from 'next/image'
import Link from 'next/link'
import { Github, Twitter, MessageCircle, Mail, Send } from 'lucide-react'

export function Footer() {
    return (
        <footer className="w-full py-8 px-4 md:px-8 lg:px-12 bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Logo */}
                <div className="flex items-center">
                    <Image
                        src="/cavos-black.png"
                        alt="Cavos"
                        width={100}
                        height={40}
                        className="h-8 w-auto"
                    />
                </div>

                <div className="flex items-center gap-6">
                    <a
                        href="https://discord.gg/Vvq2ekEV47"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-black transition-colors"
                        aria-label="Discord"
                    >
                        <MessageCircle className="w-5 h-5" />
                    </a>
                    <a
                        href="https://x.com/cavosxyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-black transition-colors"
                        aria-label="X (Twitter)"
                    >
                        <Twitter className="w-5 h-5" />
                    </a>
                    <a
                        href="https://github.com/cavos-labs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-black transition-colors"
                        aria-label="GitHub"
                    >
                        <Github className="w-5 h-5" />
                    </a>
                    <a
                        href="https://t.me/adrianvrj"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-black transition-colors"
                        aria-label="Founder Telegram"
                    >
                        <Send className="w-5 h-5" />
                    </a>
                    <a
                        href="mailto:adrianvrj@cavos.xyz"
                        className="text-gray-500 hover:text-black transition-colors"
                        aria-label="Support Email"
                    >
                        <Mail className="w-5 h-5" />
                    </a>
                </div>

                <p className="text-sm text-gray-400">
                    © {new Date().getFullYear()} Cavos Labs. All rights reserved.
                </p>
            </div>
        </footer>
    )
}
