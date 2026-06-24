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
    default: 'Cavos Docs — device-native smart accounts',
    template: '%s | Cavos Docs',
  },
  description:
    'Documentation for @cavos/kit — device-native, verifiable smart accounts on Starknet. MPC-free, gasless, no seed phrases. Built for agents: send these docs to an LLM and ship.',
  metadataBase: new URL('https://docs.cavos.xyz'),
  openGraph: {
    title: 'Cavos Docs — device-native smart accounts',
    description:
      'Documentation for @cavos/kit — device-native, verifiable smart accounts. MPC-free, gasless, no seed phrases.',
    url: 'https://docs.cavos.xyz',
    siteName: 'Cavos Docs',
    type: 'website',
    images: [{ url: '/og-docs.png', width: 1200, height: 675, alt: 'Cavos Docs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cavos Docs — device-native smart accounts',
    description:
      'Documentation for @cavos/kit — device-native, verifiable smart accounts. MPC-free, gasless, no seed phrases.',
    images: ['/og-docs.png'],
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
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
