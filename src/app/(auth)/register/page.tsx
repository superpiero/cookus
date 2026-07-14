import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Registrace" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  return (
    <Card className="p-6">
      <h1 className="font-display mb-1 text-2xl">Registrace</h1>
      <p className="mb-4 text-sm text-smoke">Za minutu máš profil, který za tebe mluví.</p>
      <RegisterForm initialKind={kind === "institution" ? "INSTITUTION" : "PERSON"} />
      <p className="mt-4 text-center text-sm text-smoke">
        Už máš účet?{" "}
        <Link href="/login" className="font-bold text-cherry underline">
          Přihlas se
        </Link>
      </p>
    </Card>
  );
}
