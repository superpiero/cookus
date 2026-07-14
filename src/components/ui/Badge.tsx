import type { ReactNode } from "react";

type Variant = "neutral" | "mustard" | "teal" | "cherry" | "outline";

const variants: Record<Variant, string> = {
  neutral: "bg-porcelain text-vinyl border-vinyl",
  mustard: "bg-mustard text-vinyl border-vinyl",
  teal: "bg-teal text-white border-vinyl",
  cherry: "bg-cherry text-white border-vinyl",
  outline: "bg-transparent text-smoke border-chrome",
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-[1.5px] px-2.5 py-0.5 text-xs font-extrabold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
