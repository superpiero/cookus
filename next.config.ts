import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Obrázky servírujeme vlastní routou /api/img (bytea v DB) — next/image optimalizaci nepotřebujeme.
  images: { unoptimized: true },
  // Seed endpoint čte demo fotky ze souborů — musí se přibalit do serverless bundle.
  outputFileTracingIncludes: {
    "/api/admin/seed": ["./prisma/seed-images/**/*"],
  },
};

export default nextConfig;
