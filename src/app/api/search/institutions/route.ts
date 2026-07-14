import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** Autocomplete podniků pro propojení praxe. */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Nepřihlášený uživatel" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ results: [] });

  const results = await db.user.findMany({
    where: {
      kind: "INSTITUTION",
      OR: [{ name: { contains: q, mode: "insensitive" } }, { handle: { contains: q, mode: "insensitive" } }],
    },
    select: { id: true, name: true, handle: true, city: true, verified: true, avatarImageId: true },
    take: 8,
    orderBy: { name: "asc" },
  });
  return Response.json({ results });
}
