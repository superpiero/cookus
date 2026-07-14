import "server-only";
import { db } from "./db";

// Výměnná vrstva úložiště obrázků (docs/02 §5). MVP: bytea v Postgres.
// Přechod na Vercel Blob = reimplementace tohoto modulu, features se nemění.

export const IMAGE_MIME_WHITELIST = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB, bezpečně pod Vercel 4.5 MB
export const MAX_IMAGES_PER_USER = 100;

/** Kontrola magic bytes — Content-Type z formuláře je spoofovatelný. */
export function sniffImageMime(buf: Buffer): (typeof IMAGE_MIME_WHITELIST)[number] | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf.length > 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  )
    return "image/png";
  if (
    buf.length > 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}

export async function saveImage(
  ownerId: string,
  data: Buffer,
  mime: string,
  width: number,
  height: number
): Promise<string> {
  const image = await db.imageBlob.create({
    data: { ownerId, data, mime, width, height },
    select: { id: true },
  });
  return image.id;
}

export function imageUrl(id: string | null | undefined): string | null {
  return id ? `/api/img/${id}` : null;
}
