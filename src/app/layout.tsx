import type { Metadata, Viewport } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Archmage — Rift Survivor",
  description:
    "A pure arcade roguelike. Thirteen elements, seventy-eight resonances, five shuffled tyrants, adaptive procedural music — and zero interruptions. Weave spells fast enough and the rift sings your name.",
  keywords: [
    "Archmage", "roguelike", "roguelite", "magic", "canvas game",
    "wave survival", "spell weaving", "browser game", "Hades-like",
    "Vampire Survivors-like",
  ],
  icons: {
    icon: [
      { url: `${basePath}/favicon.png`, sizes: "32x32", type: "image/png" },
      { url: `${basePath}/favicon-48.png`, sizes: "48x48", type: "image/png" },
    ],
    apple: { url: `${basePath}/apple-touch-icon.png`, sizes: "180x180" },
  },
  manifest: `${basePath}/manifest.json`,
  openGraph: {
    title: "Archmage — Rift Survivor",
    description:
      "A pure arcade roguelike — thirteen elements, seventy-eight resonances, five shuffled tyrants, and zero interruptions.",
    images: [{ url: `${basePath}/og-image.jpg`, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Archmage — Rift Survivor",
    description:
      "A pure arcade roguelike — thirteen elements, seventy-eight resonances, five shuffled tyrants, and zero interruptions.",
    images: [`${basePath}/og-image.jpg`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0b0716",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router root layout (not a pages-router page); runtime link avoids next/font build-time network dependency */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ background: "#0b0716", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
