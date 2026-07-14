import Link from "next/link";

export type TabItem = { href: string; label: string; active: boolean; count?: number };

export function Tabs({ items }: { items: TabItem[] }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Záložky">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`rounded-full border-2 border-vinyl px-4 py-1.5 text-sm font-extrabold ${
            t.active ? "bg-vinyl text-vanilla" : "bg-porcelain text-vinyl hover:bg-chrome-light"
          }`}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 text-xs opacity-70">{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}
