import { db } from "@/lib/db";
import { IMAGE_MIME_WHITELIST } from "@/lib/images";

export const runtime = "nodejs";

// Obrázky jsou veřejné (odpovídá veřejným profilům), id je nehádatelné cuid.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await db.imageBlob.findUnique({
    where: { id },
    select: { data: true, mime: true },
  });
  if (!image || !IMAGE_MIME_WHITELIST.includes(image.mime as never)) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(Buffer.from(image.data), {
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
