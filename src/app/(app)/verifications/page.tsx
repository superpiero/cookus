import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatMonthYear } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerificationCard } from "@/components/verifications/VerificationCard";

export const metadata: Metadata = { title: "Žádosti o potvrzení praxe" };

export default async function VerificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/verifications");
  if (user.kind !== "INSTITUTION") redirect("/feed");

  const requests = await db.experience.findMany({
    where: { institutionId: user.id, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      startDate: true,
      endDate: true,
      description: true,
      person: { select: { name: true, handle: true, avatarImageId: true } },
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-3xl">Žádosti o potvrzení praxe</h1>
        <p className="text-sm text-smoke">
          Lidé, kteří uvádějí praxi u vás. Potvrzením (klidně i s krátkou referencí) jim dáte badge{" "}
          <b className="text-teal">✓ Ověřeno podnikem</b>.
        </p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="Žádné čekající žádosti"
          description="Až někdo uvede praxi u vás, objeví se tady a dáme vám vědět notifikací i e-mailem."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <VerificationCard
              key={request.id}
              item={{
                id: request.id,
                role: request.role,
                period: `${formatMonthYear(request.startDate)} – ${request.endDate ? formatMonthYear(request.endDate) : "dosud"}`,
                description: request.description,
                person: request.person,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
