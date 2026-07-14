import type { ComponentProps, ReactNode } from "react";

const inputBase =
  "w-full rounded-card border-2 border-vinyl bg-porcelain px-3.5 py-2.5 text-base placeholder:text-smoke/70 focus:outline-none focus-visible:outline-2 focus-visible:outline-cherry";

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-extrabold uppercase tracking-wide">
      {children}
    </label>
  );
}

export function Input({ className = "", ...rest }: ComponentProps<"input">) {
  return <input className={`${inputBase} ${className}`} {...rest} />;
}

export function Textarea({ className = "", ...rest }: ComponentProps<"textarea">) {
  return <textarea className={`${inputBase} min-h-24 ${className}`} {...rest} />;
}

export function Select({ className = "", children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={`${inputBase} appearance-none ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-smoke">{children}</p>;
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1 text-sm font-bold text-ketchup">
      {children}
    </p>
  );
}
