import Link from "next/link";

export function CookusMark({ size = 36, inverse = false }: { size?: number; inverse?: boolean }) {
  const bg = inverse ? "#FFF6E9" : "#D62828";
  const fg = inverse ? "#D62828" : "#FFF6E9";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden focusable="false">
      <circle cx="60" cy="60" r="60" fill={bg} />
      <circle cx="60" cy="60" r="53" fill="none" stroke={fg} strokeWidth="4" />
      <g fill={fg}>
        <circle cx="55" cy="54" r="13" />
        <circle cx="69" cy="47" r="15" />
        <circle cx="83" cy="54" r="13" />
        <rect x="51" y="54" width="38" height="14" />
        <rect x="55" y="71" width="30" height="13" rx="3.5" />
        <rect x="21" y="51" width="16" height="6" rx="3" />
        <rect x="15" y="62" width="22" height="6" rx="3" />
        <rect x="23" y="73" width="14" height="6" rx="3" />
        <path d="M91 25 l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6 Z" />
      </g>
    </svg>
  );
}

export function Logo({
  size = "md",
  href = "/",
  inverse = false,
}: {
  size?: "sm" | "md" | "lg";
  href?: string | null;
  inverse?: boolean;
}) {
  const mark = { sm: 28, md: 36, lg: 48 }[size];
  const text = { sm: "text-xl", md: "text-2xl", lg: "text-4xl" }[size];
  const content = (
    <span className="inline-flex items-center gap-2">
      <CookusMark size={mark} inverse={inverse} />
      <span className={`font-display ${text} tracking-wide ${inverse ? "text-vanilla" : "text-vinyl"}`}>
        Cookus
      </span>
    </span>
  );
  if (!href) return content;
  return (
    <Link href={href} className="shrink-0" aria-label="Cookus — domů">
      {content}
    </Link>
  );
}
