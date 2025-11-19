import type { Metadata } from "next";
import { romagothicbold, geist } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cavos | Invisible crypto infrastructure",
  description: "Session-based smart contract wallets for Starknet. Build invisible wallets with seamless onboarding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${romagothicbold.variable} ${geist.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
