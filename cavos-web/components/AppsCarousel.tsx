import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import { AppWindow } from 'lucide-react'

export async function AppsCarousel() {
    const supabase = createAdminClient()
    const { data: apps } = await supabase
        .from('apps')
        .select('id, name, logo_url')
        .limit(20)

    if (!apps || apps.length === 0) return null

    // If we have few apps (<= 4), show them centered without scrolling
    const showStatic = apps.length <= 4
    const displayApps = showStatic ? apps : Array(10).fill(apps).flat()

    return (
        <div className="w-full h-full flex flex-col justify-center overflow-hidden bg-white">
            <div className="text-right mb-40 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto w-full">
                <p className="text-lg md:text-xl text-black/60">
                    This is the future of blockchain and crypto apps.
                </p>
            </div>

            <div className="relative w-full max-w-[100vw]">
                <div className={`flex ${showStatic ? 'justify-center w-full flex-wrap gap-8 md:gap-12' : 'animate-scroll w-max hover:[animation-play-state:paused]'}`}>
                    {displayApps.map((app, index) => (
                        <div
                            key={`${app.id}-${index}`}
                            className={`${showStatic ? '' : 'mx-6 md:mx-10'} shrink-0`}
                        >
                            <div
                                className="animate-float"
                                style={{
                                    animationDelay: `${index * 0.2}s`,
                                    animationDuration: `${3 + (index % 3) * 0.5}s`
                                }}
                            >
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-black shadow-lg flex items-center justify-center border border-black/5 relative group transition-transform hover:scale-110 duration-300">
                                    {app.logo_url ? (
                                        <Image
                                            src={app.logo_url}
                                            alt={app.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <AppWindow className="w-8 h-8 text-white/50" />
                                    )}

                                    {/* Tooltip */}
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded pointer-events-none">
                                        {app.name}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
