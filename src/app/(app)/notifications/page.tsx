import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { NotificationType } from "@prisma/client";

export const metadata: Metadata = { title: "Notifikace" };

function notificationText(type: NotificationType, actorName: string, jobTitle?: string | null): string {
  switch (type) {
    case "LIKE":
      return `${actorName} dal/a ❤️ tvojí fotce`;
    case "COMMENT":
      return `${actorName} okomentoval/a tvoji fotku`;
    case "MESSAGE":
      return `${actorName} ti poslal/a zprávu`;
    case "APPLICATION":
      return `${actorName} se hlásí${jobTitle ? ` na „${jobTitle}“` : " na vaši pozici"}`;
    case "APPLICATION_STATUS":
      return `${actorName} změnil/a stav tvé přihlášky${jobTitle ? ` na „${jobTitle}“` : ""}`;
    case "EXPERIENCE_REQUEST":
      return `${actorName} žádá o potvrzení praxe`;
    case "EXPERIENCE_CONFIRMED":
      return `${actorName} potvrdil/a tvoji praxi ✓`;
    case "EXPERIENCE_DECLINED":
      return `${actorName} odmítl/a potvrzení praxe`;
  }
}

function notificationHref(notification: {
  type: NotificationType;
  postId: string | null;
  jobId: string | null;
  conversationId: string | null;
}): string {
  switch (notification.type) {
    case "LIKE":
    case "COMMENT":
      return notification.postId ? `/post/${notification.postId}` : "/feed";
    case "MESSAGE":
      return notification.conversationId ? `/messages/${notification.conversationId}` : "/messages";
    case "APPLICATION":
      return notification.jobId ? `/jobs/${notification.jobId}/applicants` : "/jobs";
    case "APPLICATION_STATUS":
      return "/applications";
    case "EXPERIENCE_REQUEST":
      return "/verifications";
    case "EXPERIENCE_CONFIRMED":
    case "EXPERIENCE_DECLINED":
      return "/settings";
  }
}

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/notifications");

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      readAt: true,
      createdAt: true,
      postId: true,
      jobId: true,
      conversationId: true,
      actor: { select: { name: true, avatarImageId: true } },
      job: { select: { title: true } },
    },
  });

  // Zobrazení stránky = přečteno (docs/03 §5)
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-3xl">Notifikace</h1>
      {notifications.length === 0 ? (
        <EmptyState
          title="Zatím žádné notifikace"
          description="Až někdo lajkne tvou fotku, napíše ti nebo se přihlásí na tvou pozici, uvidíš to tady."
        />
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              interactive
              className={`relative p-3 ${notification.readAt ? "" : "border-cherry"}`}
            >
              <Link href={notificationHref(notification)} className="flex items-center gap-3 after:absolute after:inset-0">
                <Avatar name={notification.actor.name} imageId={notification.actor.avatarImageId} size="md" />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${notification.readAt ? "" : "font-extrabold"}`}>
                    {notificationText(notification.type, notification.actor.name, notification.job?.title)}
                  </span>
                  <span className="text-xs text-smoke">{timeAgo(notification.createdAt)}</span>
                </span>
                {!notification.readAt && (
                  <span className="size-2.5 shrink-0 rounded-full bg-cherry" aria-label="Nepřečtené" />
                )}
              </Link>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
