import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

// DB-backed sliding window (docs/02 §9) — in-memory čítače jsou na serverless
// per-instance, a tedy neúčinné pro bezpečnostní limity (login/registrace).

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/** Vrátí true, pokud je akce povolena; zaznamená pokus. */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  // E2E testy se přihlašují desítkami účtů z jedné IP — limit by testoval sám sebe
  if (process.env.DISABLE_RATE_LIMITS === "1") return true;
  const since = new Date(Date.now() - windowSeconds * 1000);
  const count = await db.rateLimitHit.count({ where: { key, createdAt: { gt: since } } });
  if (count >= max) return false;
  await db.rateLimitHit.create({ data: { key } });
  // oportunistický úklid starých záznamů (~1 % požadavků)
  if (Math.random() < 0.01) {
    await db.rateLimitHit
      .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } } })
      .catch(() => {});
  }
  return true;
}
