"use client";

import { Heart } from "lucide-react";
import { useOptimistic, useTransition, useState } from "react";
import { toggleLikeAction } from "@/actions/posts";

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
  loggedIn,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  loggedIn: boolean;
}) {
  const [state, setState] = useState({ liked: initialLiked, count: initialCount });
  const [optimistic, setOptimistic] = useOptimistic(state);
  const [, startTransition] = useTransition();

  const onClick = () => {
    if (!loggedIn) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    startTransition(async () => {
      setOptimistic((prev) => ({ liked: !prev.liked, count: prev.count + (prev.liked ? -1 : 1) }));
      const result = await toggleLikeAction(postId);
      if ("liked" in result) setState(result);
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={optimistic.liked}
      aria-label={optimistic.liked ? "Zrušit lajk" : "Dát lajk"}
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-extrabold tabular-nums hover:bg-chrome-light"
    >
      <Heart
        className={`size-5 transition ${optimistic.liked ? "fill-cherry stroke-cherry" : "stroke-vinyl"}`}
        aria-hidden
      />
      {optimistic.count}
    </button>
  );
}
