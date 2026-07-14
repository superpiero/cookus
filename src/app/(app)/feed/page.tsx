import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostCard, type PostCardData } from "@/components/posts/PostCard";

export const metadata: Metadata = { title: "Feed" };

const PAGE_SIZE = 12;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login?next=/feed");
  const { cursor } = await searchParams;

  const posts = await db.post.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-3xl">Feed</h1>
        <Button href="/post/new" size="sm">
          Přidat fotku
        </Button>
      </div>

      {cards.length === 0 && !cursor ? (
        <EmptyState
          title="Feed je zatím prázdný"
          description="Buď první, kdo ukáže, jak gastro žije — přidej fotku."
          action={<Button href="/post/new" size="sm">Přidat fotku</Button>}
        />
      ) : (
        <div className="space-y-6">
          {cards.map((post) => (
            <PostCard key={post.id} post={post} loggedIn />
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button href={`/feed?cursor=${page[page.length - 1]!.id}`} variant="secondary" size="sm">
                Načíst další
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
