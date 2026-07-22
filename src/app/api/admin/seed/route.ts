import { PrismaClient } from "@prisma/client";
import { runLiveDemoSeed } from "@/lib/demo-seed";

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel si hodnotu ořízne na maximum plánu

/**
 * Nahraje živý demo obsah přímo na serveru (kde je přístup k DB) — bez nutnosti
 * lokálního prostředí. Chráněno env proměnnou SEED_TOKEN; bez ní endpoint neexistuje.
 * POZOR: maže celou databázi.
 *
 * Použití: GET/POST /api/admin/seed?token=<SEED_TOKEN>&confirm=ano
 */
async function handle(req: Request) {
  const url = new URL(req.url);
  const expected = process.env.SEED_TOKEN;

  if (!expected) {
    return Response.json(
      { error: "Endpoint je vypnutý. Nastav env proměnnou SEED_TOKEN a redeployni." },
      { status: 404 }
    );
  }
  if (url.searchParams.get("token") !== expected) {
    return Response.json({ error: "Neplatný token." }, { status: 403 });
  }
  if (url.searchParams.get("confirm") !== "ano") {
    return Response.json(
      { error: "Chybí potvrzení. POZOR: seed smaže celou databázi. Potvrď přidáním &confirm=ano do URL." },
      { status: 400 }
    );
  }

  // Vlastní klient s vyšším limitem připojení (přes URL, bez duplicitních
  // parametrů — DATABASE_URL už typicky obsahuje connection_limit=1).
  const connectionUrl = new URL(process.env.DATABASE_URL ?? "");
  connectionUrl.searchParams.set("connection_limit", "5");
  connectionUrl.searchParams.set("pool_timeout", "120");
  const db = new PrismaClient({ datasources: { db: { url: connectionUrl.toString() } } });

  const startedAt = Date.now();
  try {
    await runLiveDemoSeed(db);
    const [users, posts, jobs] = await Promise.all([db.user.count(), db.post.count(), db.job.count()]);
    return Response.json({
      ok: true,
      seconds: Math.round((Date.now() - startedAt) / 1000),
      counts: { ucty: users, fotky: posts, pozice: jobs },
      message:
        "Hotovo! Živý demo obsah je nahraný. Heslo všech demo účtů: cookus123 (admin: admin@cookus.cz). " +
        "Doporučení: smaž teď env proměnnou SEED_TOKEN, ať endpoint zmizí.",
    });
  } catch (err) {
    console.error("[seed:error]", err);
    return Response.json({ error: "Seed selhal — mrkni do logů funkce." }, { status: 500 });
  } finally {
    await db.$disconnect();
  }
}

export { handle as GET, handle as POST };
