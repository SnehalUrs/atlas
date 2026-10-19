import type { Metadata } from "next";
import { Barlow_Condensed, Cormorant_Garamond, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { brand } from "@/lib/brand";
import "./globals.css";

const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const sourceSerif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"], style: ["normal", "italic"] });
const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "500", "600"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description: brand.description,
  authors: [{ name: brand.author }],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cormorant.variable} ${sourceSerif.variable} ${barlow.variable} ${geistMono.variable} font-serif antialiased`}>
        {children}
      </body>
    </html>
  );
}
