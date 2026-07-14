"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { logoutAction } from "@/actions/auth";

type MenuUser = {
  name: string;
  handle: string;
  avatarImageId: string | null;
  kind: "PERSON" | "INSTITUTION";
  isAdmin: boolean;
};

export function UserMenu({ user }: { user: MenuUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "block w-full px-4 py-2 text-left text-sm font-semibold hover:bg-chrome-light";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu účtu"
        className="rounded-full"
      >
        <Avatar name={user.name} imageId={user.avatarImageId} size="md" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-card border-2 border-vinyl bg-porcelain shadow-diner"
        >
          <div className="border-b-2 border-chrome px-4 py-2">
            <div className="truncate text-sm font-extrabold">{user.name}</div>
            <div className="truncate text-xs text-smoke">@{user.handle}</div>
          </div>
          <Link href={`/p/${user.handle}`} className={item} onClick={() => setOpen(false)}>
            Můj profil
          </Link>
          <Link href="/friends" className={item} onClick={() => setOpen(false)}>
            Přátelé
          </Link>
          {user.kind === "PERSON" && (
            <Link href="/applications" className={item} onClick={() => setOpen(false)}>
              Moje přihlášky
            </Link>
          )}
          {user.kind === "INSTITUTION" && (
            <Link href="/verifications" className={item} onClick={() => setOpen(false)}>
              Žádosti o potvrzení
            </Link>
          )}
          <Link href="/settings" className={item} onClick={() => setOpen(false)}>
            Nastavení
          </Link>
          {user.isAdmin && (
            <Link href="/admin" className={item} onClick={() => setOpen(false)}>
              Administrace
            </Link>
          )}
          <form action={logoutAction} className="border-t-2 border-chrome">
            <button type="submit" className={`${item} text-ketchup`}>
              Odhlásit se
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
