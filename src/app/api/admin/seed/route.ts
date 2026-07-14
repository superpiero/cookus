import { db } from "@/lib/db";
import { runLiveDemoSeed } from "@/lib/demo-seed";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  try {
    await runLiveDemoSeed(db);
    return Response.json({
      ok: true,
      message:
        "Hotovo! Živý demo obsah je nahraný. Heslo všech demo účtů: cookus123 (admin: admin@cookus.cz). " +
        "Doporučení: smaž teď env proměnnou SEED_TOKEN, ať endpoint zmizí.",
    });
  } catch (err) {
    console.error("[seed:error]", err);
    return Response.json({ error: "Seed selhal — mrkni do logů funkce." }, { status: 500 });
  }
}

export { handle as GET, handle as POST };
