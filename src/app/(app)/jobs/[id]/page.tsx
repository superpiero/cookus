import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Pencil, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { EMPLOYMENT_TYPE_LABELS, JOB_CATEGORY_LABELS, APPLICATION_STATUS_LABELS } from "@/lib/const";
import { formatSalary, timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApplyBox } from "@/components/jobs/ApplyBox";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await db.job.findUnique({
    where: { id },
    select: { title: true, city: true, institution: { select: { name: true } } },
  });
  if (!job) return { title: "Pozice nenalezena" };
  return { title: `${job.title} — ${job.institution.name}, ${job.city}` };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getSessionUser();

  const job = await db.job.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      category: true,
      employmentType: true,
      city: true,
      address: true,
      salaryMin: true,
      salaryMax: true,
      salaryPeriod: true,
      description: true,
      status: true,
      createdAt: true,
      institutionId: true,
      institution: {
        select: { name: true, handle: true, verified: true, avatarImageId: true, category: true, city: true },
      },
      _count: { select: { applications: true } },
    },
  });
  if (!job) notFound();

  const isOwner = viewer?.id === job.institutionId;
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod);

  const existingApplication =
    viewer && viewer.kind === "PERSON"
      ? await db.application.findUnique({
          where: { jobId_applicantId: { jobId: job.id, applicantId: viewer.id } },
          select: { status: true },
        })
      : null;

  const applicantProfile =
    viewer && viewer.kind === "PERSON" && !existingApplication && job.status === "OPEN"
      ? {
          name: viewer.name,
          avatarImageId: viewer.avatarImageId,
          headline: (await db.user.findUnique({ where: { id: viewer.id }, select: { headline: true } }))?.headline ?? null,
          verifiedCount: await db.experience.count({ where: { personId: viewer.id, status: "CONFIRMED" } }),
        }
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl leading-tight">{job.title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-smoke">
              <span>{JOB_CATEGORY_LABELS[job.category]}</span>
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="size-3.5" aria-hidden />
                {job.city}
                {job.address ? ` · ${job.address}` : ""}
              </span>
              <span>{timeAgo(job.createdAt)}</span>
            </p>
          </div>
          {job.status === "CLOSED" ? (
            <Badge variant="outline">Obsazeno</Badge>
          ) : (
            <Badge variant="mustard">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
          )}
        </div>

        {salary && <p className="mt-3 font-display text-2xl tabular-nums">{salary}</p>}

        <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{job.description}</div>

        <div className="mt-6 border-t-2 border-chrome pt-4">
          {isOwner ? (
            <div className="flex flex-wrap gap-2">
              <Button href={`/jobs/${job.id}/applicants`} size="sm">
                <Users className="size-4" /> Uchazeči ({job._count.applications})
              </Button>
              <Button href={`/jobs/${job.id}/edit`} variant="secondary" size="sm">
                <Pencil className="size-4" /> Upravit
              </Button>
            </div>
          ) : existingApplication ? (
            <p className="rounded-card border-2 border-chrome bg-vanilla px-4 py-3 text-sm font-semibold">
              Už ses přihlásil/a — stav:{" "}
              <Badge variant={existingApplication.status === "HIRED" ? "teal" : "neutral"}>
                {APPLICATION_STATUS_LABELS[existingApplication.status]}
              </Badge>{" "}
              <Link href="/applications" className="underline">
                Moje přihlášky
              </Link>
            </p>
          ) : job.status === "CLOSED" ? (
            <p className="text-sm text-smoke">Tahle pozice už je obsazená. Mrkni na další v nabídce.</p>
          ) : applicantProfile ? (
            <ApplyBox jobId={job.id} profile={applicantProfile} />
          ) : viewer?.kind === "INSTITUTION" ? (
            <p className="text-sm text-smoke">Na pozice se hlásí osobní profily.</p>
          ) : (
            <Button href={`/login?next=/jobs/${job.id}`} size="lg">
              Přihlas se profilem — za minutu
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <Link href={`/p/${job.institution.handle}`} className="flex items-center gap-3">
          <Avatar name={job.institution.name} imageId={job.institution.avatarImageId} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-extrabold">
              {job.institution.name}
              {job.institution.verified && <BadgeCheck className="size-4 text-teal" aria-label="Ověřený podnik" />}
            </div>
            <div className="text-sm text-smoke">Zobrazit profil podniku →</div>
          </div>
        </Link>
      </Card>
    </div>
  );
}
