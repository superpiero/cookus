-- Dedup nepřečtených notifikací: od téhož aktéra, téhož typu, ke stejnému cíli
-- smí existovat max 1 nepřečtená notifikace (viz docs/02-architecture.md §2.2).
-- Partial unique index nejde vyjádřit v Prisma schématu, proto ruční SQL.
CREATE UNIQUE INDEX "notif_dedup_unread" ON "Notification" (
  "userId",
  "actorId",
  "type",
  coalesce("postId", ''),
  coalesce("conversationId", '')
) WHERE "readAt" IS NULL;
