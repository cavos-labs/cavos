import Link from 'next/link'

export function Footer() {
    return (
        <footer className="bg-white border-t border-gray-50 py-24 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
                <div className="col-span-2 space-y-6">
                    <div className="font-bold text-2xl tracking-tighter">✦ CAVOS</div>
                    <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                         Verifiable, MPC-free embedded wallets for the next generation of applications on Starknet.
                    </p>
                </div>
                
                <div className="space-y-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-black">Product</h5>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li><Link href="https://docs.cavos.xyz" target="_blank" className="hover:text-black transition-colors">Documentation</Link></li>
                        <li><Link href="https://github.com/cavos-labs/cavos-skills" target="_blank" className="hover:text-black transition-colors">SDK & Skills</Link></li>
                        <li><Link href="/compare" className="hover:text-black transition-colors">Compare</Link></li>
                        <li><Link href="#" className="hover:text-black transition-colors opacity-30 cursor-not-allowed">Status</Link></li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-black">Company</h5>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li><Link href="#" className="hover:text-black transition-colors opacity-30 cursor-not-allowed">About</Link></li>
                        <li><Link href="#" className="hover:text-black transition-colors opacity-30 cursor-not-allowed">Blog</Link></li>
                        <li><Link href="mailto:hello@cavos.xyz" className="hover:text-black transition-colors">Contact</Link></li>
                        <li><Link href="https://github.com/cavos-labs" target="_blank" className="hover:text-black transition-colors">GitHub</Link></li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-black">Legal</h5>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li><Link href="#" className="hover:text-black transition-colors opacity-30 cursor-not-allowed">Privacy</Link></li>
                        <li><Link href="#" className="hover:text-black transition-colors opacity-30 cursor-not-allowed">Terms</Link></li>
                        <li><Link href="#" className="hover:text-black transition-colors opacity-30 cursor-not-allowed">Security</Link></li>
                    </ul>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto mt-24 pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">© 2026 Cavos Labs. All rights reserved.</p>
                <div className="flex items-center gap-6 grayscale opacity-40">
                    <Link href="https://twitter.com/cavos_xyz" target="_blank">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </Link>
                </div>
            </div>
        </footer>
    )
}
