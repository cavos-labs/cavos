import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Cavos Docs — multichain embedded wallets',
    template: '%s | Cavos Docs',
  },
  description:
    'Build device-native, verifiable smart accounts across blockchains with @cavos/kit. Guides for Starknet, Solana, Stellar, React, and React Native.',
  metadataBase: new URL('https://docs.cavos.xyz'),
  alternates: {
    canonical: 'https://docs.cavos.xyz',
  },
  keywords: [
    '@cavos/kit',
    'multichain embedded wallet SDK',
    'device-native smart accounts',
    'self-custodial wallet SDK',
    'Starknet wallet SDK',
    'Solana embedded wallet',
    'Stellar wallet SDK',
    'gasless transactions',
  ],
  openGraph: {
    title: 'Cavos Docs — multichain embedded wallets',
    description:
      'Integrate device-native smart accounts across Starknet, Solana, Stellar, and the chains that come next.',
    url: 'https://docs.cavos.xyz',
    siteName: 'Cavos Docs',
    type: 'website',
    images: [{ url: '/og-docs.png', width: 1200, height: 675, alt: 'Cavos multichain embedded wallet documentation' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cavos Docs — multichain embedded wallets',
    description:
      'Integrate device-native smart accounts across Starknet, Solana, Stellar, and the chains that come next.',
    images: ['/og-docs.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://cavos.xyz/#organization',
      name: 'Cavos Labs',
      url: 'https://cavos.xyz',
      description:
        'Cavos Labs builds device-native, verifiable smart-account infrastructure for every blockchain.',
      sameAs: ['https://x.com/cavosxyz', 'https://github.com/cavos-labs'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://docs.cavos.xyz/#website',
      name: 'Cavos Docs',
      url: 'https://docs.cavos.xyz',
      publisher: { '@id': 'https://cavos.xyz/#organization' },
      inLanguage: 'en',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://docs.cavos.xyz/#software',
      name: '@cavos/kit',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web, iOS, Android',
      description:
        'Device-native, self-custodial embedded wallet SDK with chain-native adapters for Starknet, Solana, and Stellar.',
      url: 'https://docs.cavos.xyz',
      publisher: { '@id': 'https://cavos.xyz/#organization' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier available.',
      },
    },
  ],
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <link
          rel="alternate"
          type="text/plain"
          href="/llms-full.txt"
          title="LLMs-full.txt — complete Cavos docs as plain text"
        />
      </head>
      <body className="flex flex-col min-h-screen font-sans antialiased">
        <RootProvider
          theme={{
            enabled: false,
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
