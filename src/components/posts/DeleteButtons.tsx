"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteCommentAction, deletePostAction } from "@/actions/posts";

export function DeletePostButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Opravdu smazat tenhle post včetně komentářů a lajků?")) {
          startTransition(() => deletePostAction(postId));
        }
      }}
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-bold text-ketchup hover:bg-chrome-light"
    >
      <Trash2 className="size-4" aria-hidden /> Smazat post
    </button>
  );
}

export function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Smazat komentář"
      onClick={() => startTransition(() => deleteCommentAction(commentId))}
      className="rounded-full p-1 text-smoke hover:bg-chrome-light hover:text-ketchup"
    >
      <Trash2 className="size-3.5" aria-hidden />
    </button>
  );
}
