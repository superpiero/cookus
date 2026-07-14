import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { startConversationAction } from "@/actions/messages";
import { APPLICATION_STATUS_LABELS } from "@/lib/const";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ApplicationStatusButtons } from "@/components/jobs/ApplicationStatusButtons";

export const metadata: Metadata = { title: "Uchazeči" };

export default async function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/jobs/${id}/applicants`);

  const job = await db.job.findUnique({
    where: { id },
    select: { id: true, title: true, institutionId: true, status: true },
  });
  if (!job || job.institutionId !== user.id) notFound();

  // Otevření seznamu = SENT → VIEWED (docs/03 §3.4; VIEWED nenotifikujeme)
  await db.application.updateMany({
    where: { jobId: job.id, status: "SENT" },
    data: { status: "VIEWED" },
  });

  const applications = await db.application.findMany({
    where: { jobId: job.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      status: true,
      createdAt: true,
      applicant: {
        select: {
          id: true,
          name: true,
          handle: true,
          headline: true,
          city: true,
          avatarImageId: true,
          skills: { orderBy: { position: "asc" }, take: 5, select: { id: true, name: true } },
          _count: { select: { experiencesAsPerson: { where: { status: "CONFIRMED" } } } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href={`/jobs/${job.id}`} className="text-sm text-smoke underline">
          ← {job.title}
        </Link>
        <h1 className="font-display text-3xl">Uchazeči ({applications.length})</h1>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title="Zatím žádné přihlášky"
          description="Sdílej inzerát nebo oslov lidi přímo v adresáři Lidé."
          action={<Button href="/people?openToWork=1" size="sm">Najít kandidáty</Button>}
        />
      ) : (
        <ul className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <Avatar
                  name={application.applicant.name}
                  imageId={application.applicant.avatarImageId}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/p/${application.applicant.handle}`} className="font-extrabold underline">
                      {application.applicant.name}
                    </Link>
                    {application.applicant._count.experiencesAsPerson > 0 && (
                      <Badge variant="teal">
                        <BadgeCheck className="size-3.5" />
                        {application.applicant._count.experiencesAsPerson}× ověřená praxe
                      </Badge>
                    )}
                    <Badge variant={application.status === "HIRED" ? "teal" : "neutral"}>
                      {APPLICATION_STATUS_LABELS[application.status]}
                    </Badge>
                  </div>
                  {application.applicant.headline && (
                    <p className="text-sm text-smoke">{application.applicant.headline}</p>
                  )}
                  <p className="text-xs text-smoke">
                    {application.applicant.city ? `${application.applicant.city} · ` : ""}
                    přihláška {timeAgo(application.createdAt)}
                  </p>
                  {application.applicant.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {application.applicant.skills.map((skill) => (
                        <Badge key={skill.id} variant="outline">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {application.message && (
                    <blockquote className="mt-2 rounded-card border-2 border-chrome bg-vanilla p-3 text-sm">
                      {application.message}
                    </blockquote>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t-2 border-chrome pt-3">
                <ApplicationStatusButtons applicationId={application.id} current={application.status} />
                <form action={startConversationAction.bind(null, application.applicant.id)}>
                  <Button type="submit" variant="secondary" size="sm">
                    <MessageCircle className="size-4" /> Napsat zprávu
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
