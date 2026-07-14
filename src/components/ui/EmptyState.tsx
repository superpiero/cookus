import type { ReactNode } from "react";

export function Sparkle({ className = "size-6", fill = "#F2A93B" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path d="M10 1 l2 5.2 5.2 2 -5.2 2 -2 5.2 -2 -5.2 -5.2 -2 5.2 -2Z" fill={fill} />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border-2 border-dashed border-chrome bg-porcelain/60 px-6 py-10 text-center">
      <Sparkle className="mx-auto size-8" />
      <h3 className="mt-3 text-lg font-extrabold">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-smoke">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
