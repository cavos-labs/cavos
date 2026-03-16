import type { Metadata, Viewport } from "next";
import { romagothicbold, geist } from "@/lib/fonts";
import "./globals.css";
import { AnalyticsConsent } from "@/components/AnalyticsConsent";

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Cavos | Invisible Crypto Infrastructure",
    template: "%s | Cavos"
  },
  description: "Cavos is a verifiable, MPC-free embedded wallet SDK for Starknet. Turn Google or Apple OAuth logins into self-custodial smart accounts with on-chain RSA-2048 verification — no seed phrases, no browser extensions, no MPC shards.",
  keywords: [
    "embedded wallet",
    "account abstraction",
    "OAuth wallet",
    "self-custodial wallet",
    "MPC-free wallet",
    "Web3 onboarding",
    "crypto infrastructure",
    "AI agent signer",
    "Starknet wallet",
    "gasless transactions",
    "session keys",
    "smart accounts",
    "social login Web3",
    "on-chain RSA verification",
    "Cairo smart contracts",
    "invisible wallet",
    "Privy alternative",
    "Dynamic alternative",
    "embedded crypto wallet SDK"
  ],
  applicationName: "Cavos",
  authors: [{ name: "Cavos Labs", url: "https://cavos.xyz" }],
  creator: "Cavos Labs",
  publisher: "Cavos Labs",
  metadataBase: new URL("https://cavos.xyz"),
  openGraph: {
    title: "Cavos | Invisible Crypto Infrastructure",
    description: "Verifiable, MPC-free embedded wallets for Starknet. Turn OAuth identities into self-custodial smart accounts with on-chain RSA-2048 verification.",
    url: "https://cavos.xyz",
    siteName: "Cavos",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cavos — MPC-free embedded wallets with on-chain RSA verification for Starknet",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cavos | Invisible Crypto Infrastructure",
    description: "Verifiable, MPC-free embedded wallets. OAuth logins → self-custodial Starknet smart accounts. No seed phrases, no MPC shards.",
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
      "description": "Cavos Labs builds invisible crypto infrastructure — verifiable, MPC-free embedded wallets for Starknet.",
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
      "description": "Invisible crypto infrastructure — verifiable, MPC-free embedded wallets for Starknet",
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
        className={`${romagothicbold.variable} ${geist.variable} antialiased`}
      >
        {children}
        <AnalyticsConsent />
      </body>
    </html>
  );
}
