import Link from "next/link";
import { Plus } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { NavBadges } from "./NavBadges";
import { UserMenu } from "./UserMenu";
import type { getSessionUser } from "@/lib/auth";

type NavUser = Awaited<ReturnType<typeof getSessionUser>>;

const link = "rounded-full px-3 py-1.5 text-sm font-extrabold hover:bg-chrome-light";

export function AppNav({ user }: { user: NavUser }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-vinyl bg-vanilla/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5">
        <Logo size="sm" href={user ? "/feed" : "/"} />
        <nav className="ml-2 flex items-center" aria-label="Hlavní navigace">
          {user && (
            <Link href="/feed" className={link}>
              Feed
            </Link>
          )}
          <Link href="/jobs" className={link}>
            Práce
          </Link>
          <Link href="/people" className={link}>
            Lidé
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Button href="/post/new" size="sm" className="max-sm:px-2.5">
                <Plus className="size-4" aria-hidden />
                <span className="max-sm:hidden">Přidat fotku</span>
              </Button>
              <NavBadges />
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Button href="/login" variant="ghost" size="sm">
                Přihlásit
              </Button>
              <Button href="/register" size="sm">
                Registrace
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
