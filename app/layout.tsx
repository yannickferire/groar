import type { Metadata } from "next";
import { Averia_Serif_Libre, Bricolage_Grotesque, DM_Mono, DM_Serif_Display, Inter, Playfair_Display, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

// Editor-only fonts: preload: false to defer download until editor is loaded
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: false,
});

const averiaSerifLibre = Averia_Serif_Libre({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-averia-serif-libre",
  display: "swap",
  preload: false,
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif-display",
  display: "swap",
  preload: false,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Groar — Turn your X growth into visuals that Roaaar",
    template: "%s | Groar",
  },
  description:
    "Your analytics deserve better than a screenshot. Get eye-catching visuals in 10 seconds. Built for builders, founders and indie hackers.",
  keywords: [
    "x analytics visual",
    "twitter growth",
    "twitter milestone",
    "build in public",
    "x metrics",
    "twitter analytics design",
    "social media visuals",
    "follower milestone",
    "x growth visual",
    "creator tools",
    "share analytics",
    "engagement",
  ],
  authors: [{ name: "Yannick Ferire", url: "https://x.com/yannick_ferire" }],
  creator: "Yannick Ferire",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Groar",
    title: "Groar — Turn your X growth into visuals that Roaaar",
    description:
      "Your analytics deserve better than a screenshot. Get eye-catching visuals in 10 seconds. Built for builders, founders and indie hackers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Groar — Share your X growth with stunning visuals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Groar — Turn your X growth into visuals that Roaaar",
    description:
      "Your analytics deserve better than a screenshot. Get eye-catching visuals in 10 seconds. Built for builders, founders and indie hackers.",
    images: ["/og-image.png"],
    creator: "@yannick_ferire",
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bricolage.variable} ${dmMono.variable} ${inter.variable} ${playfair.variable} ${spaceGrotesk.variable} ${averiaSerifLibre.variable} ${dmSerifDisplay.variable} antialiased`}
      >
        {children}
        <Toaster />
        <Analytics />
        <Script
          src="https://datafa.st/js/script.js"
          data-website-id="dfid_KCoXqvjnSG1gNXFzbmksp"
          data-domain="groar.app"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
