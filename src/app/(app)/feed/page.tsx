import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getFriendIds } from "@/lib/friends";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { PostCard, type PostCardData } from "@/components/posts/PostCard";

export const metadata: Metadata = { title: "Feed" };

const PAGE_SIZE = 12;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; tab?: string }>;
}) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login?next=/feed");
  const { cursor, tab } = await searchParams;

  const friendIds = await getFriendIds(viewer.id);
  // Výchozí tab: Přátelé, pokud nějaké mám; jinak Vše (docs/03 §2.4)
  const activeTab = tab === "pratele" || tab === "vse" ? tab : friendIds.length > 0 ? "pratele" : "vse";

  const where =
    activeTab === "pratele" ? { authorId: { in: [...friendIds, viewer.id] } } : {};

  const posts = await db.post.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], // čistě chronologicky, žádný algoritmus
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      imageId: true,
      caption: true,
      aspect: true,
      createdAt: true,
      author: { select: { name: true, handle: true, avatarImageId: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: viewer.id }, select: { id: true } },
    },
  });

  const hasMore = posts.length > PAGE_SIZE;
  const page = posts.slice(0, PAGE_SIZE);

  const cards: PostCardData[] = page.map((post) => ({
    id: post.id,
    imageId: post.imageId,
    caption: post.caption,
    aspect: post.aspect,
    createdAt: post.createdAt,
    author: post.author,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByViewer: post.likes.length > 0,
  }));

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-3xl">Feed</h1>
        <Button href="/post/new" size="sm">
          Přidat fotku
        </Button>
      </div>

      <div className="mb-5">
        <Tabs
          items={[
            { href: "/feed?tab=pratele", label: "Přátelé", active: activeTab === "pratele", count: friendIds.length },
            { href: "/feed?tab=vse", label: "Vše", active: activeTab === "vse" },
          ]}
        />
      </div>

      {cards.length === 0 && !cursor ? (
        activeTab === "pratele" ? (
          <EmptyState
            title={friendIds.length === 0 ? "Zatím nemáš přátele" : "Tvoji přátelé zatím nic nesdíleli"}
            description="Přidej si lidi a podniky do přátel — jejich fotky se ti tu poskládají chronologicky."
            action={<Button href="/people" size="sm">Najít lidi</Button>}
          />
        ) : (
          <EmptyState
            title="Feed je zatím prázdný"
            description="Buď první, kdo ukáže, jak gastro žije — přidej fotku."
            action={<Button href="/post/new" size="sm">Přidat fotku</Button>}
          />
        )
      ) : (
        <div className="space-y-6">
          {cards.map((post) => (
            <PostCard key={post.id} post={post} loggedIn />
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                href={`/feed?tab=${activeTab}&cursor=${page[page.length - 1]!.id}`}
                variant="secondary"
                size="sm"
              >
                Načíst další
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
