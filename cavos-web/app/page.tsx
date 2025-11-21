import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { AppsCarousel } from '@/components/AppsCarousel'
import { CodeDemoSection } from '@/components/CodeDemoSection'
import { Footer } from '@/components/Footer'

export default function LandingPage() {
    return (
        <main className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-[#FFFFFF]">
            <Header />

            {/* Hero Section */}
            <section className="h-screen pt-20 w-full snap-start flex flex-col items-center justify-center relative">
                {/* ... Hero Content ... */}
                <div className="flex flex-col items-center justify-center w-full px-4 md:px-8 lg:px-12">
                    <div className="relative flex flex-col items-center text-center w-full max-w-7xl">
                        {/* ASCII Art Image */}
                        <div className="relative mb-8 md:mb-12 w-full">
                            <Image
                                src="/ascii-cavos.png"
                                alt="Cavos ASCII Art"
                                width={1000}
                                height={600}
                                className="w-full max-w-[400px] md:max-w-[700px] lg:max-w-[600px] xl:max-w-[600px] h-auto mx-auto"
                                priority
                            />

                            {/* Overlaid Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
                                <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-4xl xl:text-4xl font-semibold tracking-[-0.02em] mb-3 md:mb-6 lg:mb-8 text-black">
                                    OAuth for Blockchain
                                </h1>
                                <p className="text-base sm:text-lg md:text-2xl lg:text-2xl xl:text-2xl text-black/80 mb-6 md:mb-10 lg:mb-12 max-w-4xl">
                                    Invisible embedded wallets inside any app
                                </p>

                                {/* CTA Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 lg:gap-5">
                                    <Link
                                        href="/register"
                                        className="px-6 md:px-8 lg:px-10 py-2.5 md:py-3.5 lg:py-4 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all text-sm md:text-base lg:text-lg"
                                    >
                                        Get Started
                                    </Link>
                                    <a
                                        href="#learn-more"
                                        className="px-6 md:px-8 lg:px-10 py-2.5 md:py-3.5 lg:py-4 bg-[#f7eded] text-black rounded-full font-medium hover:bg-[#efe5e5] transition-all text-sm md:text-base lg:text-lg"
                                    >
                                        Learn More
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Apps Carousel Section */}
            <section className="h-screen w-full snap-start">
                <AppsCarousel />
            </section>

            {/* Code Demo Section + Footer */}
            <section className="min-h-screen w-full snap-start flex flex-col pt-20">
                <CodeDemoSection className="flex-1" />
                <Footer />
            </section>
        </main>
    )
}
