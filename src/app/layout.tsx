import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Archmage — Rift Survivor",
  description:
    "A pure arcade roguelike. Eleven elements, fifty-five resonances, five shuffled tyrants, adaptive procedural music — and zero interruptions. Weave spells fast enough and the rift sings your name.",
  keywords: ["Archmage", "roguelike", "roguelite", "magic", "canvas game", "wave survival", "spell weaving", "browser game", "Hades-like", "Vampire Survivors-like"],
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f5c96b' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 21 4 5l8 4 8-4-8 16z'/%3E%3Cpath d='M12 9v6'/%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
