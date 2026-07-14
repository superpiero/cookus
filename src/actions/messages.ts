"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canonicalPair } from "@/lib/conversations";
import { notify } from "@/lib/notify";
import type { FormState } from "./auth";

/** Najde nebo založí konverzaci s uživatelem a přesměruje do chatu. */
export async function startConversationAction(targetUserId: string): Promise<void> {
  const user = await requireUser();
  if (targetUserId === user.id) redirect("/messages");

  const target = await db.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) redirect("/messages");

  const pair = canonicalPair(user.id, targetUserId);
  const conversation = await db.conversation.upsert({
    where: { userAId_userBId: pair },
    create: pair,
    update: {},
    select: { id: true },
  });
  redirect(`/messages/${conversation.id}`);
}

const messageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().trim().min(1, "Zpráva nesmí být prázdná").max(4000, "Zpráva je moc dlouhá"),
});

export async function sendMessageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const { conversationId, body } = parsed.data;

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { userAId: true, userBId: true },
  });
  if (!conversation || (conversation.userAId !== user.id && conversation.userBId !== user.id))
    return { error: "Konverzace nenalezena." };

  const recipientId = conversation.userAId === user.id ? conversation.userBId : conversation.userAId;

  await db.$transaction([
    db.message.create({ data: { conversationId, senderId: user.id, body } }),
    db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
    // odesílatel má konverzaci přečtenou
    db.conversationRead.upsert({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      create: { conversationId, userId: user.id, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    }),
  ]);

  await notify({ userId: recipientId, actorId: user.id, type: "MESSAGE", conversationId });

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return null;
}
