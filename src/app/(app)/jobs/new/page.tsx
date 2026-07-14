import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { JobForm } from "@/components/jobs/JobForm";

export const metadata: Metadata = { title: "Nová pozice" };

export default async function NewJobPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/jobs/new");
  if (user.kind !== "INSTITUTION") redirect("/jobs");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display mb-1 text-3xl">Vystavit pozici</h1>
      <p className="mb-5 text-sm text-smoke">Uchazeči se hlásí svým profilem — uvidíš praxi, reference i fotky.</p>
      <JobForm />
    </div>
  );
}
