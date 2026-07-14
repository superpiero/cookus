"use client";

import Link from "next/link";
import { Bell, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

function IconWithBadge({
  href,
  label,
  count,
  children,
}: {
  href: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={count > 0 ? `${label} (${count} nepřečtených)` : label}
      className="relative rounded-full border-2 border-vinyl bg-porcelain p-2 hover:bg-chrome-light"
    >
      {children}
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-vinyl bg-cherry px-1 text-[10px] font-extrabold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export function NavBadges() {
  const [counts, setCounts] = useState({ notifications: 0, messages: 0 });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/poll/badges");
        if (res.ok && active) setCounts(await res.json());
      } catch {
        /* offline – ticho */
      }
    };
    load();
    const interval = setInterval(load, 30_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <>
      <IconWithBadge href="/messages" label="Zprávy" count={counts.messages}>
        <MessageCircle className="size-5" aria-hidden />
      </IconWithBadge>
      <IconWithBadge href="/notifications" label="Notifikace" count={counts.notifications}>
        <Bell className="size-5" aria-hidden />
      </IconWithBadge>
    </>
  );
}
