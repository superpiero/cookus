import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { AppNav } from "@/components/nav/AppNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t-2 border-vinyl">
        <div className="checker h-2.5" aria-hidden />
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-smoke">
          <span>© {new Date().getFullYear()} Cookus — gastro žije tady.</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="underline">
              Ochrana údajů
            </Link>
            <Link href="/jobs" className="underline">
              Nabídky práce
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
