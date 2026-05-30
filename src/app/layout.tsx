import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ClipFetch — YouTube & TikTok Video Downloader",
    template: "%s | ClipFetch",
  },
  description:
    "Download YouTube and TikTok videos in 480p, 720p, 1080p, or 4K. Clean, fast, and mobile-friendly.",
  keywords: [
    "video downloader",
    "youtube downloader",
    "tiktok downloader",
    "mp4 download",
    "1080p download",
  ],
  openGraph: {
    title: "ClipFetch — YouTube & TikTok Video Downloader",
    description:
      "Paste a link, pick your quality, and download. Supports YouTube and TikTok.",
    type: "website",
    locale: "en_US",
    siteName: "ClipFetch",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipFetch — Video Downloader",
    description: "Download YouTube and TikTok videos in HD and 4K.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
