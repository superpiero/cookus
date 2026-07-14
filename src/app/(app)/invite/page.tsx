import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { appUrl } from "@/lib/mail";
import { timeAgo } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { InviteForm, CopyLinkButton, CancelInviteButton } from "@/components/invite/InviteForm";

export const metadata: Metadata = { title: "Pozvat do Cookus" };

export default async function InvitePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/invite");

  const invitations = await db.invitation.findMany({
    where: { inviterId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      email: true,
      createdAt: true,
      acceptedAt: true,
      acceptedBy: { select: { name: true, handle: true } },
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="font-script text-xl text-cherry">gastro roste s lidmi</p>
        <h1 className="font-display text-3xl">Pozvat do Cookus</h1>
        <p className="mt-1 text-sm text-smoke">
          Znáš někoho z branže — kuchaře, baristku, celý podnik? Pošli pozvánku e-mailem, nebo zkopíruj odkaz
          a pošli ho po svém. Po registraci mu automaticky přistane tvoje žádost o přátelství.
        </p>
      </div>

      <Card className="p-5">
        <InviteForm />
      </Card>

      {invitations.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl">Moje pozvánky ({invitations.length})</h2>
          <ul className="space-y-2">
            {invitations.map((invitation) => {
              const link = appUrl(`/register?invite=${invitation.id}`);
              return (
                <Card key={invitation.id} className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-extrabold">{invitation.email}</span>
                    {invitation.acceptedAt ? (
                      <Badge variant="teal">
                        ✓ Registrace{" "}
                        {invitation.acceptedBy && (
                          <Link href={`/p/${invitation.acceptedBy.handle}`} className="underline">
                            {invitation.acceptedBy.name}
                          </Link>
                        )}
                      </Badge>
                    ) : (
                      <Badge variant="mustard">Čeká · {timeAgo(invitation.createdAt)}</Badge>
                    )}
                    {!invitation.acceptedAt && <CancelInviteButton invitationId={invitation.id} />}
                  </div>
                  {!invitation.acceptedAt && (
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        readOnly
                        value={link}
                        aria-label="Odkaz pozvánky"
                        className="!py-1.5 text-xs text-smoke"
                      />
                      <CopyLinkButton link={link} />
                    </div>
                  )}
                </Card>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
