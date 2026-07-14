"use client";

import { useState, useTransition } from "react";
import { Check, UserMinus, UserPlus, X } from "lucide-react";
import {
  acceptFriendshipAction,
  pokeAction,
  removePendingFriendshipAction,
  requestFriendshipAction,
  unfriendAction,
} from "@/actions/friends";
import { Button } from "@/components/ui/Button";
import type { FriendshipState } from "@/lib/friends";

export function FriendButton({ targetId, initial }: { targetId: string; initial: FriendshipState }) {
  const [pending, startTransition] = useTransition();

  switch (initial.state) {
    case "none":
      return (
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => requestFriendshipAction(targetId))}
        >
          <UserPlus className="size-4" aria-hidden /> Přidat do přátel
        </Button>
      );
    case "outgoing":
      return (
        <Button
          variant="ghost"
          size="sm"
          type="button"
          disabled={pending}
          title="Zrušit žádost"
          onClick={() => startTransition(() => removePendingFriendshipAction(initial.friendshipId))}
        >
          Žádost odeslána <X className="size-4" aria-hidden />
        </Button>
      );
    case "incoming":
      return (
        <Button
          size="sm"
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => acceptFriendshipAction(initial.friendshipId))}
        >
          <Check className="size-4" aria-hidden /> Přijmout žádost
        </Button>
      );
    case "friends":
      return (
        <Button
          variant="ghost"
          size="sm"
          type="button"
          disabled={pending}
          title="Odebrat z přátel"
          onClick={() => {
            if (confirm("Odebrat z přátel?")) startTransition(() => unfriendAction(initial.friendshipId));
          }}
        >
          <Check className="size-4 text-teal" aria-hidden /> Přátelé
          <UserMinus className="size-4 opacity-60" aria-hidden />
        </Button>
      );
  }
}

export function PokeButton({ targetId, label = "Šťouchnout" }: { targetId: string; label?: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <Button
      variant="secondary"
      size="sm"
      type="button"
      disabled={pending || done}
      onClick={() =>
        startTransition(async () => {
          const result = await pokeAction(targetId);
          if (result.ok) setDone(true);
        })
      }
    >
      👉 {done ? "Šťouchnuto!" : label}
    </Button>
  );
}
