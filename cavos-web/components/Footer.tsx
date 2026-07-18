import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
    return (
        <footer className="bg-surface border-t border-line py-20 px-8 md:px-12">
            <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 md:gap-20">
                <div className="col-span-2 space-y-6">
                    <Link href="/" className="inline-block hover:opacity-75 transition-opacity">
                        <Image
                            src="/cavos-black.png"
                            alt="Cavos Logo"
                            width={100}
                            height={40}
                            className="h-8 w-auto"
                        />
                    </Link>
                    <p className="text-sm text-black/40 max-w-xs leading-relaxed">
                        Verifiable, MPC-free embedded wallets for the next generation of applications.
                    </p>
                </div>

                <div className="space-y-5">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/50">Product</h5>
                    <ul className="space-y-3 text-sm font-medium text-black/40">
                        <li><Link href="https://docs.cavos.xyz" target="_blank" className="hover:text-black transition-colors">Documentation</Link></li>
                    </ul>
                </div>

                <div className="space-y-5">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/50">Company</h5>
                    <ul className="space-y-3 text-sm font-medium text-black/40">
                        <li><Link href="mailto:hello@cavos.xyz" className="hover:text-black transition-colors">Contact</Link></li>
                        <li><Link href="https://twitter.com/cavosxyz" target="_blank" className="hover:text-black transition-colors">X / Twitter</Link></li>
                    </ul>
                </div>

                <div className="space-y-5">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/50">Legal</h5>
                    <ul className="space-y-3 text-sm font-medium text-black/25">
                        <li><Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/dpa" className="hover:text-black transition-colors">Data Processing Agreement</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-line flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-[10px] font-bold text-black/25 uppercase tracking-[0.2em]">© 2026 Cavos Labs. All rights reserved.</p>
                <div className="flex items-center gap-8 opacity-30 hover:opacity-70 transition-opacity">
                    <Link href="https://twitter.com/cavosxyz" target="_blank">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-black"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </Link>
                </div>
            </div>
        </footer>
    )
}
