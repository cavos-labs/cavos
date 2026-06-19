import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import { Icon } from '@/components/ui/Icon'
export async function AppsCarousel() {
    const supabase = createAdminClient()
    const { data: rawApps } = await supabase
        .from('apps')
        .select('id, name, logo_url')
        .limit(20)

    // Only show apps that actually have a logo image
    const apps = (rawApps ?? []).filter((app) => !!app.logo_url)

    if (apps.length === 0) return null

    // If we have few apps (<= 4), show them centered without scrolling
    const showStatic = apps.length <= 4
    const displayApps = showStatic ? apps : Array(10).fill(apps).flat()

    return (
        <div className="w-full flex flex-col justify-center overflow-hidden py-8">
            <div className="mb-6 px-6 md:px-16 lg:px-24">
                <p className="text-xs font-medium text-ink/40">
                    Trusted by teams building the future of blockchain and crypto apps.
                </p>
            </div>

            <div className="relative w-full max-w-[100vw]">
                <div
                    className={`flex ${showStatic ? 'justify-center w-full flex-wrap gap-8 md:gap-12' : 'animate-scroll w-max hover:[animation-play-state:paused]'}`}
                    style={showStatic ? undefined : { animationDuration: '80s' }}
                >
                    {displayApps.map((app, index) => (
                        <div
                            key={`${app.id}-${index}`}
                            className={`${showStatic ? '' : 'mx-7 md:mx-12'} shrink-0`}
                        >
                            <div className="w-12 h-12 overflow-hidden rounded-lg flex items-center justify-center relative group hover:scale-105 transition-transform duration-300">
                                {app.logo_url ? (
                                    <Image
                                        src={app.logo_url}
                                        alt={app.name}
                                        fill
                                        className="object-contain"
                                    />
                                ) : (
                                    <Icon.Apps className="w-6 h-6 text-ink/30" />
                                )}

                                {/* Tooltip */}
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-ink text-white text-xs px-2 py-1 rounded pointer-events-none">
                                    {app.name}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
