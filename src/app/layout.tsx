import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cookus — gastro žije tady",
    template: "%s · Cookus",
  },
  description:
    "Profesní síť a pracovní tržiště pro gastronomii. Profil místo životopisu, praxe ověřená podniky, práce ukázaná fotkami.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <head>
        <link
          rel="preload"
          href="/fonts/archivo-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/alfa-slab-one-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
