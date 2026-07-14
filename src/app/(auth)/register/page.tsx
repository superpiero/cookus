import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Registrace" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; invite?: string }>;
}) {
  const { kind, invite } = await searchParams;

  // Banner „zve tě X“ — jen pro platnou nevyčerpanou pozvánku
  const invitation = invite
    ? await db.invitation.findFirst({
        where: { id: invite, acceptedAt: null },
        select: { id: true, inviter: { select: { name: true, avatarImageId: true } } },
      })
    : null;

  return (
    <Card className="p-6">
      <h1 className="font-display mb-1 text-2xl">Registrace</h1>
      <p className="mb-4 text-sm text-smoke">Za minutu máš profil, který za tebe mluví.</p>
      {invitation && (
        <p className="mb-4 flex items-center gap-2.5 rounded-card border-2 border-teal bg-teal/10 px-3 py-2.5 text-sm font-semibold">
          <Avatar name={invitation.inviter.name} imageId={invitation.inviter.avatarImageId} size="sm" />
          <span>
            Zve tě <b>{invitation.inviter.name}</b> — po registraci vám přistane žádost o přátelství.
          </span>
        </p>
      )}
      <RegisterForm initialKind={kind === "institution" ? "INSTITUTION" : "PERSON"} inviteId={invitation?.id} />
      <p className="mt-4 text-center text-sm text-smoke">
        Už máš účet?{" "}
        <Link href="/login" className="font-bold text-cherry underline">
          Přihlas se
        </Link>
      </p>
    </Card>
  );
}
