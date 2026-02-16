import type { Metadata, Viewport } from "next";
import { romagothicbold, geist } from "@/lib/fonts";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

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
  description: "Verifiable, MPC-free embedded wallets for Starknet. Turn OAuth identities (Google, Apple) into self-custodial wallets with on-chain RSA verification.",
  keywords: [
    "Starknet",
    "Account Abstraction",
    "Embedded Wallet",
    "OAuth Wallet",
    "Self-Custodial",
    "MPC-free",
    "Starknet API",
    "Web3 Onboarding",
    "Crypto Infrastructure",
    "AI Agent Signer"
  ],
  authors: [{ name: "Cavos Labs" }],
  creator: "Cavos Labs",
  metadataBase: new URL("https://cavos.xyz"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Cavos | Invisible Crypto Infrastructure",
    description: "The premier verifiable signer for sovereign humans and AI agents on Starknet.",
    url: "https://cavos.xyz",
    siteName: "Cavos",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cavos - OAuth for Blockchain",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cavos | OAuth for Blockchain",
    description: "Verifiable, MPC-free embedded wallets for Starknet agents and humans.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${romagothicbold.variable} ${geist.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
