import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { JobForm } from "@/components/jobs/JobForm";

export const metadata: Metadata = { title: "Upravit pozici" };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/jobs/${id}/edit`);

  const job = await db.job.findUnique({
    where: { id },
    select: {
      id: true,
      institutionId: true,
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
    },
  });
  if (!job || job.institutionId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display mb-5 text-3xl">Upravit pozici</h1>
      <JobForm job={job} />
    </div>
  );
}
