import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Přihlášení" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const { next, reset } = await searchParams;
  return (
    <Card className="p-6">
      <h1 className="font-display mb-4 text-2xl">Přihlášení</h1>
      <LoginForm next={next} resetDone={reset === "1"} />
      <p className="mt-4 text-center text-sm text-smoke">
        Ještě nemáš účet?{" "}
        <Link href="/register" className="font-bold text-cherry underline">
          Zaregistruj se
        </Link>
      </p>
    </Card>
  );
}
