import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { ChatThread, type ChatMessage } from "@/components/messages/ChatThread";

export const metadata: Metadata = { title: "Konverzace" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/messages/${id}`);

  const conversation = await db.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      userAId: true,
      userBId: true,
      userA: { select: { id: true, name: true, handle: true, avatarImageId: true } },
      userB: { select: { id: true, name: true, handle: true, avatarImageId: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
        select: { id: true, senderId: true, body: true, createdAt: true },
      },
    },
  });
  if (!conversation || (conversation.userAId !== user.id && conversation.userBId !== user.id)) notFound();

  const other = conversation.userA.id === user.id ? conversation.userB : conversation.userA;

  // Otevření chatu = přečteno (docs/03 §4)
  await db.conversationRead.upsert({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
    create: { conversationId: id, userId: user.id, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });

  const initialMessages: ChatMessage[] = conversation.messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/messages" className="text-sm text-smoke underline">
          ← Zprávy
        </Link>
        <Link href={`/p/${other.handle}`} className="flex items-center gap-2">
          <Avatar name={other.name} imageId={other.avatarImageId} size="sm" />
          <span className="font-extrabold hover:underline">{other.name}</span>
        </Link>
      </div>
      <ChatThread conversationId={conversation.id} meId={user.id} initialMessages={initialMessages} />
    </div>
  );
}
