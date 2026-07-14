import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ResetPasswordForm } from "@/components/auth/PasswordForms";

export const metadata: Metadata = { title: "Nové heslo" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <Card className="p-6">
      <h1 className="font-display mb-4 text-2xl">Nové heslo</h1>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-smoke">
          Chybí token. Vyžádej si nový odkaz na{" "}
          <Link href="/forgot-password" className="font-bold text-cherry underline">
            obnovu hesla
          </Link>
          .
        </p>
      )}
    </Card>
  );
}
