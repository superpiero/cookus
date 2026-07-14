import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FriendRequestActions, UnfriendButton, CancelRequestButton } from "@/components/friends/FriendListActions";

export const metadata: Metadata = { title: "Přátelé" };

const userSelect = { id: true, name: true, handle: true, headline: true, kind: true, avatarImageId: true } as const;

export default async function FriendsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/friends");

  const [incoming, outgoing, accepted] = await Promise.all([
    db.friendship.findMany({
      where: { addresseeId: user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, requester: { select: userSelect } },
    }),
    db.friendship.findMany({
      where: { requesterId: user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, addressee: { select: userSelect } },
    }),
    db.friendship.findMany({
      where: { status: "ACCEPTED", OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
      orderBy: { respondedAt: "desc" },
      select: { id: true, requester: { select: userSelect }, addressee: { select: userSelect } },
    }),
  ]);

  const friends = accepted.map((row) => ({
    friendshipId: row.id,
    person: row.requester.id === user.id ? row.addressee : row.requester,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Přátelé</h1>
        <Button href="/invite" variant="secondary" size="sm">
          Pozvat do Cookus
        </Button>
      </div>

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl">Žádosti o přátelství</h2>
          <ul className="space-y-2">
            {incoming.map((request) => (
              <Card key={request.id} className="flex flex-wrap items-center gap-3 p-3">
                <Avatar name={request.requester.name} imageId={request.requester.avatarImageId} size="md" />
                <div className="min-w-0 flex-1">
                  <Link href={`/p/${request.requester.handle}`} className="font-extrabold underline">
                    {request.requester.name}
                  </Link>
                  <p className="truncate text-sm text-smoke">
                    {request.requester.headline ?? (request.requester.kind === "INSTITUTION" ? "podnik" : "člověk z gastra")}
                    {" · "}
                    {timeAgo(request.createdAt)}
                  </p>
                </div>
                <FriendRequestActions friendshipId={request.id} />
              </Card>
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl">Odeslané žádosti</h2>
          <ul className="space-y-2">
            {outgoing.map((request) => (
              <Card key={request.id} className="flex flex-wrap items-center gap-3 p-3">
                <Avatar name={request.addressee.name} imageId={request.addressee.avatarImageId} size="md" />
                <div className="min-w-0 flex-1">
                  <Link href={`/p/${request.addressee.handle}`} className="font-extrabold underline">
                    {request.addressee.name}
                  </Link>
                  <p className="text-sm text-smoke">čeká na přijetí · {timeAgo(request.createdAt)}</p>
                </div>
                <CancelRequestButton friendshipId={request.id} />
              </Card>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl">Moji lidé ({friends.length})</h2>
        {friends.length === 0 ? (
          <EmptyState
            title="Zatím žádní přátelé"
            description="Přidej si lidi i podniky — jejich fotky pak uvidíš ve svém feedu Přátelé."
            action={<Button href="/people" size="sm">Najít lidi</Button>}
          />
        ) : (
          <ul className="space-y-2">
            {friends.map(({ friendshipId, person }) => (
              <Card key={friendshipId} className="flex flex-wrap items-center gap-3 p-3">
                <Avatar name={person.name} imageId={person.avatarImageId} size="md" />
                <div className="min-w-0 flex-1">
                  <Link href={`/p/${person.handle}`} className="font-extrabold underline">
                    {person.name}
                  </Link>
                  <p className="truncate text-sm text-smoke">
                    {person.headline ?? ""}
                  </p>
                </div>
                {person.kind === "INSTITUTION" && <Badge variant="outline">podnik</Badge>}
                <UnfriendButton friendshipId={friendshipId} />
              </Card>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
