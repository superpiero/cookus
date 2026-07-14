const PALETTE = ["bg-cherry text-white", "bg-teal text-white", "bg-mustard text-vinyl", "bg-ketchup text-white"];

const SIZES = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-24 text-3xl",
} as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  name,
  imageId,
  size = "md",
  className = "",
}: {
  name: string;
  imageId?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const cls = `${SIZES[size]} rounded-full border-2 border-vinyl shrink-0 ${className}`;
  if (imageId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`/api/img/${imageId}`} alt="" className={`${cls} object-cover bg-chrome-light`} />
    );
  }
  return (
    <span
      className={`${cls} inline-flex items-center justify-center font-extrabold ${PALETTE[hash(name) % PALETTE.length]}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
