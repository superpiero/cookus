import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Obrázky servírujeme vlastní routou /api/img (bytea v DB) — next/image optimalizaci nepotřebujeme.
  images: { unoptimized: true },
};

export default nextConfig;
