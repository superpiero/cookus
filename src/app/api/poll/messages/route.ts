import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** Nové zprávy v konverzaci (poll 5 s). VŽDY participant-check (docs/04 #9). */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Nepřihlášený uživatel" }, { status: 401 });

  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  const after = url.searchParams.get("after"); // ISO timestamp poslední známé zprávy
  if (!conversationId) return Response.json({ error: "Chybí conversationId" }, { status: 400 });

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { userAId: true, userBId: true },
  });
  if (!conversation || (conversation.userAId !== user.id && conversation.userBId !== user.id)) {
    return Response.json({ error: "Konverzace nenalezena" }, { status: 404 });
  }

  const afterDate = after ? new Date(after) : new Date(0);
  const messages = await db.message.findMany({
    where: { conversationId, createdAt: { gt: isNaN(afterDate.getTime()) ? new Date(0) : afterDate } },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true, senderId: true, body: true, createdAt: true },
  });

  // Označit jako přečtené smí jen viditelný klient — ten posílá visible=1 (docs/04 #21)
  if (url.searchParams.get("visible") === "1" && messages.some((m) => m.senderId !== user.id)) {
    await db.conversationRead.upsert({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      create: { conversationId, userId: user.id, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    });
  }

  return Response.json({ messages });
}
