import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import type { NotificationType } from "@prisma/client";

type NotifyInput = {
  userId: string; // příjemce
  actorId: string;
  type: NotificationType;
  postId?: string | null;
  jobId?: string | null;
  applicationId?: string | null;
  experienceId?: string | null;
  conversationId?: string | null;
  friendshipId?: string | null;
};

/**
 * Vloží notifikaci s dedupem přes partial unique index notif_dedup_unread
 * (ON CONFLICT DO NOTHING — Prisma upsert partial index neumí, viz docs/02 §2.2).
 * Vlastní akce (actor == příjemce) se nenotifikují.
 */
export async function notify(input: NotifyInput): Promise<void> {
  if (input.userId === input.actorId) return;
  await db.$executeRaw`
    INSERT INTO "Notification"
      ("id", "userId", "actorId", "type", "postId", "jobId", "applicationId", "experienceId", "conversationId", "friendshipId", "createdAt")
    VALUES (
      ${randomUUID()}, ${input.userId}, ${input.actorId}, ${input.type}::"NotificationType",
      ${input.postId ?? null}, ${input.jobId ?? null}, ${input.applicationId ?? null},
      ${input.experienceId ?? null}, ${input.conversationId ?? null}, ${input.friendshipId ?? null}, now()
    )
    ON CONFLICT DO NOTHING`;
}

/** Unlike odstraní nepřečtenou LIKE notifikaci (docs/04 #5). */
export async function removeUnreadLikeNotification(postId: string, actorId: string) {
  await db.notification.deleteMany({
    where: { postId, actorId, type: "LIKE", readAt: null },
  });
}

export type { NotifyInput };
