"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/ratelimit";

async function revalidateFriendSurfaces(handles: (string | null | undefined)[]) {
  for (const handle of handles) if (handle) revalidatePath(`/p/${handle}`);
  revalidatePath("/friends");
  revalidatePath("/feed");
}

/** Žádost o přátelství; opačná čekající žádost = automatické přijetí (docs/03 §2.4). */
export async function requestFriendshipAction(targetId: string): Promise<void> {
  const user = await requireUser();
  if (targetId === user.id) return;

  const target = await db.user.findUnique({
    where: { id: targetId },
    select: { id: true, handle: true, isBlocked: true },
  });
  if (!target || target.isBlocked) return;

  const existing = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, addresseeId: targetId },
        { requesterId: targetId, addresseeId: user.id },
      ],
    },
    select: { id: true, status: true, requesterId: true },
  });

  if (!existing) {
    const friendship = await db.friendship.create({
      data: { requesterId: user.id, addresseeId: targetId },
      select: { id: true },
    });
    await notify({ userId: targetId, actorId: user.id, type: "FRIEND_REQUEST", friendshipId: friendship.id });
  } else if (existing.status === "PENDING" && existing.requesterId === targetId) {
    // druhá strana už o přátelství požádala → vzájemný zájem, rovnou přijmout
    await db.friendship.update({
      where: { id: existing.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    await notify({ userId: targetId, actorId: user.id, type: "FRIEND_ACCEPTED", friendshipId: existing.id });
  }
  // existující PENDING ode mě nebo ACCEPTED → no-op (idempotentní)

  await revalidateFriendSurfaces([user.handle, target.handle]);
}

export async function acceptFriendshipAction(friendshipId: string): Promise<void> {
  const user = await requireUser();
  const friendship = await db.friendship.findUnique({
    where: { id: friendshipId },
    select: { id: true, status: true, addresseeId: true, requesterId: true, requester: { select: { handle: true } } },
  });
  if (!friendship || friendship.addresseeId !== user.id || friendship.status !== "PENDING") return;

  await db.friendship.update({
    where: { id: friendshipId },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });
  await notify({ userId: friendship.requesterId, actorId: user.id, type: "FRIEND_ACCEPTED", friendshipId });
  await revalidateFriendSurfaces([user.handle, friendship.requester.handle]);
}

/** Odmítnutí (adresát) i zrušení žádosti (žadatel) — PENDING záznam se maže. */
export async function removePendingFriendshipAction(friendshipId: string): Promise<void> {
  const user = await requireUser();
  await db.friendship.deleteMany({
    where: {
      id: friendshipId,
      status: "PENDING",
      OR: [{ addresseeId: user.id }, { requesterId: user.id }],
    },
  });
  await revalidateFriendSurfaces([user.handle]);
}

export async function unfriendAction(friendshipId: string): Promise<void> {
  const user = await requireUser();
  await db.friendship.deleteMany({
    where: {
      id: friendshipId,
      status: "ACCEPTED",
      OR: [{ addresseeId: user.id }, { requesterId: user.id }],
    },
  });
  await revalidateFriendSurfaces([user.handle]);
}

/** Šťouchnutí (docs/03 §2.5). Vrací false při rate limitu. */
export async function pokeAction(targetId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  if (targetId === user.id) return { ok: false };

  const target = await db.user.findUnique({ where: { id: targetId }, select: { id: true, isBlocked: true } });
  if (!target || target.isBlocked) return { ok: false };

  if (!(await rateLimit(`poke:${user.id}`, 30, 3600))) return { ok: false };

  await db.poke.create({ data: { fromId: user.id, toId: targetId } });
  // dedup nepřečtených řeší partial index (docs/02 §2.2) — poke spam se sbalí do jedné
  await notify({ userId: targetId, actorId: user.id, type: "POKE" });
  return { ok: true };
}
