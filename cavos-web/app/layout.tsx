import type { Metadata, Viewport } from "next";
import { romagothicbold, geist, geistMono } from "@/lib/fonts";
import "./globals.css";
import { AnalyticsConsent } from "@/components/AnalyticsConsent";

export const viewport: Viewport = {
  themeColor: "#402AFF",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Multichain Embedded Wallet Infrastructure | Cavos",
    template: "%s | Cavos"
  },
  description: "Turn every sign-in into a self-custodial wallet. One SDK for seamless onboarding and sponsored transactions across chains.",
  keywords: [
    "embedded wallet",
    "multichain embedded wallet",
    "chain agnostic wallet infrastructure",
    "account abstraction",
    "device-native wallet",
    "device signer",
    "self-custodial wallet",
    "MPC-free wallet",
    "Web3 onboarding",
    "wallet infrastructure",
    "Starknet wallet",
    "Solana embedded wallet",
    "Stellar embedded wallet",
    "gasless transactions",
    "smart accounts",
    "P-256 wallet",
    "secp256r1 wallet",
    "verifiable self-custody",
    "Privy alternative",
    "Dynamic alternative",
    "embedded crypto wallet SDK"
  ],
  applicationName: "Cavos",
  authors: [{ name: "Cavos Labs", url: "https://cavos.xyz" }],
  creator: "Cavos Labs",
  publisher: "Cavos Labs",
  metadataBase: new URL("https://cavos.xyz"),
  alternates: {
    canonical: "https://cavos.xyz",
  },
  openGraph: {
    title: "Multichain Embedded Wallet Infrastructure | Cavos",
    description: "Turn every sign-in into a self-custodial wallet. One SDK for seamless onboarding and sponsored transactions across chains.",
    url: "https://cavos.xyz",
    siteName: "Cavos",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cavos — device-native multichain embedded wallet infrastructure",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Multichain Embedded Wallet Infrastructure | Cavos",
    description: "Turn every sign-in into a self-custodial wallet. One SDK for seamless onboarding and sponsored transactions across chains.",
    creator: "@cavosxyz",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const globalJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://cavos.xyz/#organization",
      "name": "Cavos Labs",
      "url": "https://cavos.xyz",
      "logo": {
        "@type": "ImageObject",
        "url": "https://cavos.xyz/CavosLogo.png"
      },
      "description": "Cavos Labs builds device-native, verifiable smart-account infrastructure for every blockchain.",
      "sameAs": [
        "https://twitter.com/cavosxyz",
        "https://github.com/cavos-labs"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "hello@cavos.xyz",
        "contactType": "customer support"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://cavos.xyz/#website",
      "url": "https://cavos.xyz",
      "name": "Cavos",
      "description": "Multichain embedded wallet infrastructure for device-native, verifiable smart accounts.",
      "publisher": { "@id": "https://cavos.xyz/#organization" }
    }
  ]
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt — Cavos for AI" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLd) }}
        />
      </head>
      <body
        className={`${romagothicbold.variable} ${geist.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <AnalyticsConsent />
      </body>
    </html>
  );
}
