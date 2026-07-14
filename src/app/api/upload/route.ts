import { imageSize } from "image-size";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_IMAGE_BYTES, saveImage, sniffImageMime } from "@/lib/images";
import { MAX_POSTS_PER_USER } from "@/lib/const";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Nepřihlášený uživatel" }, { status: 401 });

  // Same-origin ochrana (server actions ji mají built-in, route handler ne)
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: "Neplatný původ požadavku" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Chybí soubor" }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES)
    return Response.json({ error: "Soubor je moc velký (max 2 MB)" }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = sniffImageMime(buffer);
  if (!mime) return Response.json({ error: "Nepodporovaný formát (JPEG, PNG, WebP)" }, { status: 415 });

  let width: number, height: number;
  try {
    const dim = imageSize(buffer);
    if (!dim.width || !dim.height) throw new Error("no dims");
    width = dim.width;
    height = dim.height;
  } catch {
    return Response.json({ error: "Soubor se nepodařilo přečíst jako obrázek" }, { status: 415 });
  }

  const count = await db.imageBlob.count({ where: { ownerId: user.id } });
  if (count >= MAX_POSTS_PER_USER + 5) {
    return Response.json({ error: "Dosáhl/a jsi limitu obrázků na účet" }, { status: 403 });
  }

  const id = await saveImage(user.id, buffer, mime, width, height);
  return Response.json({ id });
}
