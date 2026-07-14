import type { ElementType, ReactNode } from "react";

export function Card({
  children,
  className = "",
  interactive = false,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: ElementType;
}) {
  return (
    <Tag
      className={`bg-porcelain border-2 border-vinyl rounded-card shadow-diner ${
        interactive ? "diner-press" : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
