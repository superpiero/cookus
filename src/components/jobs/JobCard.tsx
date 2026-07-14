import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EMPLOYMENT_TYPE_LABELS, JOB_CATEGORY_LABELS } from "@/lib/const";
import { formatSalary, timeAgo } from "@/lib/format";
import type { EmploymentType, JobCategory, SalaryPeriod } from "@prisma/client";

export type JobCardData = {
  id: string;
  title: string;
  category: JobCategory;
  employmentType: EmploymentType;
  city: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: SalaryPeriod | null;
  status: "OPEN" | "CLOSED";
  createdAt: Date;
  institution: { name: string; handle: string; verified: boolean; avatarImageId: string | null };
};

export function JobCard({ job }: { job: JobCardData }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod);
  return (
    <Card interactive className="relative p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-extrabold leading-snug">
          <Link href={`/jobs/${job.id}`} className="after:absolute after:inset-0">
            {job.title}
          </Link>
        </h3>
        <div className="flex gap-1.5">
          {job.status === "CLOSED" ? (
            <Badge variant="outline">Obsazeno</Badge>
          ) : (
            <Badge variant="mustard">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
          )}
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-smoke">
        <span className="inline-flex items-center gap-1.5">
          <Avatar name={job.institution.name} imageId={job.institution.avatarImageId} size="xs" />
          {job.institution.name}
          {job.institution.verified && <BadgeCheck className="size-4 text-teal" aria-label="Ověřený podnik" />}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <MapPin className="size-3.5" aria-hidden />
          {job.city}
        </span>
        <span>{JOB_CATEGORY_LABELS[job.category]}</span>
        <span>{timeAgo(job.createdAt)}</span>
      </div>
      {salary && <div className="mt-2 font-extrabold tabular-nums">{salary}</div>}
    </Card>
  );
}
