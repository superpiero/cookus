import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** Badge počty pro navigaci (poll 30 s): nepřečtené notifikace + zprávy. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Nepřihlášený uživatel" }, { status: 401 });

  const [notifications, messagesRows] = await Promise.all([
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    // Jeden dotaz bez N+1 (docs/02 §6)
    db.$queryRaw<[{ count: number }]>`
      SELECT count(*)::int AS count FROM "Message" m
      JOIN "Conversation" c ON c.id = m."conversationId"
      LEFT JOIN "ConversationRead" r ON r."conversationId" = c.id AND r."userId" = ${user.id}
      WHERE (c."userAId" = ${user.id} OR c."userBId" = ${user.id})
        AND m."senderId" <> ${user.id}
        AND m."createdAt" > coalesce(r."lastReadAt", 'epoch'::timestamptz)`,
  ]);

  return Response.json({ notifications, messages: messagesRows[0]?.count ?? 0 });
}
