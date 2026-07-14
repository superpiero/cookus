import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { LikeButton } from "@/components/posts/LikeButton";
import { CommentForm } from "@/components/posts/CommentForm";
import { DeleteCommentButton, DeletePostButton } from "@/components/posts/DeleteButtons";
import { Button } from "@/components/ui/Button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await db.post.findUnique({
    where: { id },
    select: { caption: true, author: { select: { name: true } } },
  });
  if (!post) return { title: "Post nenalezen" };
  return { title: `${post.author.name}: ${post.caption?.slice(0, 60) ?? "fotka"}` };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getSessionUser();

  const post = await db.post.findUnique({
    where: { id },
    select: {
      id: true,
      imageId: true,
      caption: true,
      aspect: true,
      createdAt: true,
      authorId: true,
      author: { select: { name: true, handle: true, avatarImageId: true } },
      _count: { select: { likes: true, comments: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        take: 200,
        select: {
          id: true,
          body: true,
          createdAt: true,
          authorId: true,
          author: { select: { name: true, handle: true, avatarImageId: true } },
        },
      },
    },
  });
  if (!post) notFound();

  const likedByViewer = viewer
    ? !!(await db.like.findUnique({
        where: { postId_userId: { postId: id, userId: viewer.id } },
        select: { id: true },
      }))
    : false;

  const canDeletePost = viewer && (viewer.id === post.authorId || viewer.isAdmin);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-2.5">
          <Avatar name={post.author.name} imageId={post.author.avatarImageId} size="sm" />
          <Link href={`/p/${post.author.handle}`} className="truncate text-sm font-extrabold hover:underline">
            {post.author.name}
          </Link>
          <span className="ml-auto shrink-0 text-xs text-smoke">{timeAgo(post.createdAt)}</span>
        </div>
        <div className="border-y-2 border-vinyl bg-vinyl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/img/${post.imageId}`}
            alt={post.caption ?? "Fotka"}
            className={`w-full object-cover ${post.aspect === "SQUARE" ? "aspect-square" : "aspect-4/5"}`}
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2">
          <LikeButton postId={post.id} initialLiked={likedByViewer} initialCount={post._count.likes} loggedIn={!!viewer} />
          <span className="text-sm font-extrabold tabular-nums text-smoke">
            {post._count.comments} komentářů
          </span>
          {canDeletePost && (
            <span className="ml-auto">
              <DeletePostButton postId={post.id} />
            </span>
          )}
        </div>
        {post.caption && (
          <p className="whitespace-pre-wrap px-4 pb-3 text-sm">
            <Link href={`/p/${post.author.handle}`} className="font-extrabold">
              {post.author.name}
            </Link>{" "}
            {post.caption}
          </p>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 font-display text-lg">Komentáře</h2>
        {post.comments.length === 0 && <p className="mb-3 text-sm text-smoke">Zatím žádný komentář — buď první.</p>}
        <ul className="mb-4 space-y-3">
          {post.comments.map((comment) => {
            const canDelete = viewer && (viewer.id === comment.authorId || viewer.id === post.authorId || viewer.isAdmin);
            return (
              <li key={comment.id} className="flex items-start gap-2.5">
                <Avatar name={comment.author.name} imageId={comment.author.avatarImageId} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <Link href={`/p/${comment.author.handle}`} className="font-extrabold hover:underline">
                      {comment.author.name}
                    </Link>{" "}
                    {comment.body}
                  </p>
                  <span className="text-xs text-smoke">{timeAgo(comment.createdAt)}</span>
                </div>
                {canDelete && <DeleteCommentButton commentId={comment.id} />}
              </li>
            );
          })}
        </ul>
        {viewer ? (
          <CommentForm postId={post.id} />
        ) : (
          <Button href={`/login?next=/post/${post.id}`} variant="secondary" size="sm">
            Přihlas se a komentuj
          </Button>
        )}
      </Card>
    </div>
  );
}
