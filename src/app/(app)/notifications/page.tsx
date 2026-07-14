import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PokeButton } from "@/components/friends/FriendButtons";
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
    case "POKE":
      return `👉 ${actorName} tě šťouchl/a`;
    case "FRIEND_REQUEST":
      return `${actorName} tě žádá o přátelství`;
    case "FRIEND_ACCEPTED":
      return `${actorName} přijal/a tvoji žádost — jste přátelé 🤝`;
  }
}

function notificationHref(notification: {
  type: NotificationType;
  postId: string | null;
  jobId: string | null;
  conversationId: string | null;
  actorHandle: string;
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
    case "POKE":
    case "FRIEND_ACCEPTED":
      return `/p/${notification.actorHandle}`;
    case "FRIEND_REQUEST":
      return "/friends";
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
      actor: { select: { id: true, name: true, handle: true, avatarImageId: true } },
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
          description="Až někdo lajkne tvou fotku, šťouchne tě nebo se přihlásí na tvou pozici, uvidíš to tady."
        />
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              interactive
              className={`relative p-3 ${notification.readAt ? "" : "border-cherry"}`}
            >
              <div className="flex items-center gap-3">
                <Link
                  href={notificationHref({ ...notification, actorHandle: notification.actor.handle })}
                  className="flex min-w-0 flex-1 items-center gap-3 after:absolute after:inset-0"
                >
                  <Avatar name={notification.actor.name} imageId={notification.actor.avatarImageId} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${notification.readAt ? "" : "font-extrabold"}`}>
                      {notificationText(notification.type, notification.actor.name, notification.job?.title)}
                    </span>
                    <span className="text-xs text-smoke">{timeAgo(notification.createdAt)}</span>
                  </span>
                </Link>
                {notification.type === "POKE" && (
                  <span className="relative z-10 shrink-0">
                    <PokeButton targetId={notification.actor.id} label="Šťouchnout zpátky" />
                  </span>
                )}
                {!notification.readAt && (
                  <span className="size-2.5 shrink-0 rounded-full bg-cherry" aria-label="Nepřečtené" />
                )}
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
