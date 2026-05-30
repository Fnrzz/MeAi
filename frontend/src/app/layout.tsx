import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Syne } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const syne = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "MeAi | AI Agent Marketplace on Sui",
  description:
    "Pay for LLM inference with SUI tokens. API keys as NFT capabilities. Built for the Agentic Web.",
  icons: [{ rel: "icon", url: "/logo.png" }],
  openGraph: {
    title: "MeAi | AI Agent Marketplace on Sui",
    description: "Pay for LLM inference with SUI tokens. API keys as NFT capabilities.",
    siteName: "MeAi",
    type: "website",
    images: [{ url: "/logo.png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
