import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Zprávy" };

export default async function MessagesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/messages");

  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ userAId: user.id }, { userBId: user.id }],
      messages: { some: {} },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    select: {
      id: true,
      lastMessageAt: true,
      userA: { select: { id: true, name: true, handle: true, avatarImageId: true } },
      userB: { select: { id: true, name: true, handle: true, avatarImageId: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, senderId: true } },
    },
  });

  // Nepřečtené počty jedním dotazem (žádné N+1)
  const unreadRows = await db.$queryRaw<{ conversationId: string; count: number }[]>`
    SELECT m."conversationId", count(*)::int AS count FROM "Message" m
    JOIN "Conversation" c ON c.id = m."conversationId"
    LEFT JOIN "ConversationRead" r ON r."conversationId" = c.id AND r."userId" = ${user.id}
    WHERE (c."userAId" = ${user.id} OR c."userBId" = ${user.id})
      AND m."senderId" <> ${user.id}
      AND m."createdAt" > coalesce(r."lastReadAt", 'epoch'::timestamptz)
    GROUP BY m."conversationId"`;
  const unreadByConversation = new Map(unreadRows.map((r) => [r.conversationId, r.count]));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-3xl">Zprávy</h1>
      {conversations.length === 0 ? (
        <EmptyState
          title="Zatím žádné konverzace"
          description="Napiš komukoli — lidem i podnikům — přímo z jejich profilu."
          action={<Button href="/people" size="sm">Najít lidi</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {conversations.map((conversation) => {
            const other = conversation.userA.id === user.id ? conversation.userB : conversation.userA;
            const last = conversation.messages[0];
            const unread = unreadByConversation.get(conversation.id) ?? 0;
            return (
              <Card key={conversation.id} interactive className="relative p-3">
                <Link href={`/messages/${conversation.id}`} className="flex items-center gap-3 after:absolute after:inset-0">
                  <Avatar name={other.name} imageId={other.avatarImageId} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${unread ? "font-extrabold" : "font-semibold"}`}>
                      {other.name}
                    </span>
                    {last && (
                      <span className={`block truncate text-sm ${unread ? "font-bold" : "text-smoke"}`}>
                        {last.senderId === user.id ? "Ty: " : ""}
                        {last.body}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs text-smoke">{timeAgo(conversation.lastMessageAt)}</span>
                    {unread > 0 && (
                      <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-vinyl bg-cherry px-1 text-[10px] font-extrabold text-white">
                        {unread}
                      </span>
                    )}
                  </span>
                </Link>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
