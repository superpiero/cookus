"use client";

import { useTransition } from "react";
import {
  acceptFriendshipAction,
  removePendingFriendshipAction,
  unfriendAction,
} from "@/actions/friends";
import { Button } from "@/components/ui/Button";

export function FriendRequestActions({ friendshipId }: { friendshipId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <span className="flex gap-2">
      <Button size="sm" type="button" disabled={pending} onClick={() => startTransition(() => acceptFriendshipAction(friendshipId))}>
        Přijmout
      </Button>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => removePendingFriendshipAction(friendshipId))}
      >
        Odmítnout
      </Button>
    </span>
  );
}

export function CancelRequestButton({ friendshipId }: { friendshipId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => removePendingFriendshipAction(friendshipId))}
    >
      Zrušit žádost
    </Button>
  );
}

export function UnfriendButton({ friendshipId }: { friendshipId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      className="text-ketchup"
      disabled={pending}
      onClick={() => {
        if (confirm("Odebrat z přátel?")) startTransition(() => unfriendAction(friendshipId));
      }}
    >
      Odebrat
    </Button>
  );
}
