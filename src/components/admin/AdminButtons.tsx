"use client";

import { useTransition } from "react";
import {
  adminDeleteCommentAction,
  adminDeleteJobAction,
  adminDeletePostAction,
  adminToggleBlockAction,
  adminToggleVerifiedAction,
} from "@/actions/admin";

const buttonClass =
  "rounded-full border-2 border-vinyl px-2.5 py-0.5 text-xs font-extrabold bg-porcelain hover:bg-chrome-light disabled:opacity-50";

function ActionButton({
  label,
  confirmText,
  action,
  danger,
}: {
  label: string;
  confirmText?: string;
  action: () => Promise<void>;
  danger?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={`${buttonClass} ${danger ? "text-ketchup" : ""}`}
      onClick={() => {
        if (confirmText && !confirm(confirmText)) return;
        startTransition(action);
      }}
    >
      {label}
    </button>
  );
}

export function AdminDeletePost({ postId }: { postId: string }) {
  return <ActionButton label="Smazat" danger confirmText="Smazat post?" action={() => adminDeletePostAction(postId)} />;
}
export function AdminDeleteComment({ commentId }: { commentId: string }) {
  return (
    <ActionButton label="Smazat" danger confirmText="Smazat komentář?" action={() => adminDeleteCommentAction(commentId)} />
  );
}
export function AdminDeleteJob({ jobId }: { jobId: string }) {
  return <ActionButton label="Smazat" danger confirmText="Smazat inzerát?" action={() => adminDeleteJobAction(jobId)} />;
}
export function AdminToggleBlock({ userId, blocked }: { userId: string; blocked: boolean }) {
  return (
    <ActionButton
      label={blocked ? "Odblokovat" : "Zablokovat"}
      danger={!blocked}
      confirmText={blocked ? undefined : "Zablokovat účet? Uživatel se nepřihlásí."}
      action={() => adminToggleBlockAction(userId)}
    />
  );
}
export function AdminToggleVerified({ userId, verified }: { userId: string; verified: boolean }) {
  return (
    <ActionButton
      label={verified ? "Odebrat ověření" : "Ověřit podnik"}
      action={() => adminToggleVerifiedAction(userId)}
    />
  );
}
