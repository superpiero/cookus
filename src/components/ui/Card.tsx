import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`bg-porcelain border-2 border-vinyl rounded-card shadow-diner ${
        interactive ? "diner-press" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
