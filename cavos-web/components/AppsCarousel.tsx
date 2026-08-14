import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import { Icon } from '@/components/ui/Icon'
import { AppsCarouselTrack } from '@/components/AppsCarouselTrack'
export async function AppsCarousel() {
    const supabase = createAdminClient()
    const { data: rawApps } = await supabase
        .from('apps')
        .select('id, name, logo_url')
        .limit(20)

    // Only show apps that actually have a logo image
    const apps = (rawApps ?? []).filter((app) => !!app.logo_url)

    if (apps.length === 0) return null

    // Few enough to see at once? Then there's nothing to scroll, and a moving
    // strip would be motion for its own sake.
    const showStatic = apps.length <= 4

    return (
        <div className="w-full flex flex-col justify-center overflow-hidden py-8">
            <div className="mb-6 px-6 md:px-16 lg:px-24">
                <p className="text-xs font-medium text-ink/40">
                    Trusted by teams building the future of blockchain and crypto apps.
                </p>
            </div>

            <div className="relative w-full max-w-[100vw]">
                {showStatic ? (
                    <div className="flex w-full flex-wrap justify-center gap-8 md:gap-12">
                        {apps.map((app) => (
                            <div key={app.id} className="shrink-0">
                                <div className="group relative flex h-12 w-12 items-center justify-center rounded-lg">
                                    {app.logo_url ? (
                                        <Image src={app.logo_url} alt={app.name} fill className="rounded-lg object-contain" />
                                    ) : (
                                        <Icon.Apps className="h-6 w-6 text-ink/30" />
                                    )}
                                    <span className="pointer-events-none absolute -bottom-8 left-1/2 origin-top -translate-x-1/2 scale-90 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white opacity-0 blur-[2px] transition-[opacity,transform,filter] duration-200 group-hover:scale-100 group-hover:opacity-100 group-hover:blur-0">
                                        {app.name}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <AppsCarouselTrack apps={apps} />
                )}
            </div>
        </div>
    )
}
