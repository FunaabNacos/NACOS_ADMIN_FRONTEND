import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/layout/providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://nacosfunaab.com.ng"),

  title: {
    default: "NACOS Platform",
    template: "%s | NACOS Platform",
  },

  description:
    "NACOS Platform for association fee collection, digital receipts, payments, and financial management.",

  applicationName: "NACOS Platform",

  generator: "Next.js",

  keywords: [
    "NACOS",
    "NACOS Platform",
    "association management",
    "association fees",
    "fee collection",
    "digital receipts",
    "finance management",
    "payments",
    "student association",
  ],

  authors: [
    {
      name: "Ayomikun Egbetola",
    },
  ],

  creator: "NACOS",
  publisher: "NACOS",

  referrer: "origin-when-cross-origin",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: [
      {
        url: "/admin/favicon-32.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/admin/icon-192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/admin/icon-512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],

    apple: [
      {
        url: "/admin/apple-touch-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],

    other: [
      {
        rel: "msapplication-TileImage",
        url: "/admin/mstile-144x144.png",
      },
    ],
  },

  manifest: "/admin/manifest.webmanifest",

  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://nacosfunaab.com.ng",
    siteName: "NACOS Platform",
    title: "NACOS Platform",
    description:
      "Association fee collection, digital receipts, payments, and financial management for NACOS.",
    images: [
      {
        url: "/admin/icon-512.png",
        width: 512,
        height: 512,
        alt: "NACOS Platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "NACOS Platform",
    description:
      "Association fee collection, digital receipts, payments, and financial management for NACOS.",
    images: ["/admin/icon-512.png"],
  },

  appleWebApp: {
    capable: true,
    title: "NACOS Platform",
    statusBarStyle: "default",
  },

  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
