import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="checker h-3" aria-hidden />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-6 flex justify-center">
          <Logo size="md" />
        </div>
        {children}
        <p className="mt-6 text-center text-sm text-smoke">
          <Link href="/" className="font-semibold underline">
            ← Zpět na úvod
          </Link>
        </p>
      </main>
      <div className="checker h-3" aria-hidden />
    </div>
  );
}
