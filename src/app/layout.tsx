import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bangladesh Startup Ecosystem Map",
  description: "Explore Bangladesh's thriving startup ecosystem. Discover innovative companies, entrepreneurs, and investment opportunities across various sectors including fintech, e-commerce, healthtech, and more.",
  keywords: ["Bangladesh", "startup", "ecosystem", "entrepreneurs", "fintech", "e-commerce", "investment", "innovation", "technology"],
  authors: [{ name: "Bangladesh Startup Ecosystem" }],
  creator: "Bangladesh Startup Ecosystem",
  publisher: "Bangladesh Startup Ecosystem",
  robots: "index, follow",
  openGraph: {
    title: "Bangladesh Startup Ecosystem Map",
    description: "Explore Bangladesh's thriving startup ecosystem. Discover innovative companies, entrepreneurs, and investment opportunities.",
    type: "website",
    locale: "en_US",
    siteName: "Bangladesh Startup Ecosystem Map",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bangladesh Startup Ecosystem Map",
    description: "Explore Bangladesh's thriving startup ecosystem. Discover innovative companies, entrepreneurs, and investment opportunities.",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
