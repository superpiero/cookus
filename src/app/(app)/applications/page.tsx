import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { APPLICATION_STATUS_LABELS } from "@/lib/const";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Moje přihlášky" };

export default async function ApplicationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/applications");
  if (user.kind !== "PERSON") redirect("/jobs");

  const applications = await db.application.findMany({
    where: { applicantId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      job: {
        select: {
          id: true,
          title: true,
          city: true,
          status: true,
          institution: { select: { name: true, avatarImageId: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-3xl">Moje přihlášky</h1>
      {applications.length === 0 ? (
        <EmptyState
          title="Zatím ses nikam nepřihlásil/a"
          description="Mrkni na aktuální pozice — přihláška profilem zabere minutu."
          action={<Button href="/jobs" size="sm">Prohlédnout pozice</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {applications.map((application) => (
            <Card key={application.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={application.job.institution.name}
                  imageId={application.job.institution.avatarImageId}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <Link href={`/jobs/${application.job.id}`} className="font-extrabold underline">
                    {application.job.title}
                  </Link>
                  <p className="text-sm text-smoke">
                    {application.job.institution.name} · {application.job.city} · {timeAgo(application.createdAt)}
                    {application.job.status === "CLOSED" && " · inzerát uzavřen"}
                  </p>
                </div>
                <Badge
                  variant={
                    application.status === "HIRED"
                      ? "teal"
                      : application.status === "REJECTED"
                        ? "outline"
                        : application.status === "SHORTLISTED"
                          ? "mustard"
                          : "neutral"
                  }
                >
                  {APPLICATION_STATUS_LABELS[application.status]}
                </Badge>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
