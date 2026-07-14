import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { timeAgo } from "@/lib/format";
import { LikeButton } from "./LikeButton";

export type PostCardData = {
  id: string;
  imageId: string;
  caption: string | null;
  aspect: "SQUARE" | "PORTRAIT";
  createdAt: Date;
  author: { name: string; handle: string; avatarImageId: string | null };
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
};

export function PostCard({ post, loggedIn }: { post: PostCardData; loggedIn: boolean }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <Avatar name={post.author.name} imageId={post.author.avatarImageId} size="sm" />
        <Link href={`/p/${post.author.handle}`} className="truncate text-sm font-extrabold hover:underline">
          {post.author.name}
        </Link>
        <span className="ml-auto shrink-0 text-xs text-smoke">{timeAgo(post.createdAt)}</span>
      </div>
      <Link href={`/post/${post.id}`} className="block border-y-2 border-vinyl bg-vinyl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/img/${post.imageId}`}
          alt={post.caption ?? "Fotka"}
          loading="lazy"
          className={`w-full object-cover ${post.aspect === "SQUARE" ? "aspect-square" : "aspect-4/5"}`}
        />
      </Link>
      <div className="flex items-center gap-2 px-3 py-2">
        <LikeButton
          postId={post.id}
          initialLiked={post.likedByViewer}
          initialCount={post.likeCount}
          loggedIn={loggedIn}
        />
        <Link
          href={`/post/${post.id}`}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-extrabold tabular-nums hover:bg-chrome-light"
        >
          <MessageCircle className="size-5" aria-hidden />
          {post.commentCount}
        </Link>
      </div>
      {post.caption && (
        <p className="px-4 pb-3 text-sm">
          <Link href={`/p/${post.author.handle}`} className="font-extrabold">
            {post.author.name}
          </Link>{" "}
          {post.caption.length > 160 ? (
            <>
              {post.caption.slice(0, 160)}…{" "}
              <Link href={`/post/${post.id}`} className="text-smoke underline">
                víc
              </Link>
            </>
          ) : (
            post.caption
          )}
        </p>
      )}
    </Card>
  );
}
