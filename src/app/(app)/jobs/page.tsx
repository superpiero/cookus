import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { CITIES, EMPLOYMENT_TYPE_LABELS, JOB_CATEGORY_LABELS } from "@/lib/const";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { JobCard } from "@/components/jobs/JobCard";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Nabídky práce v gastru",
  description: "Kuchaři, číšníci, baristi, barmani — aktuální pozice v gastronomii. Přihlas se profilem za minutu.",
};

const PAGE_SIZE = 20;

type Filters = { q?: string; category?: string; type?: string; city?: string; salary?: string; cursor?: string };

export default async function JobsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = await searchParams;
  const viewer = await getSessionUser();

  const where: Prisma.JobWhereInput = { status: "OPEN" };
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.category && filters.category in JOB_CATEGORY_LABELS) where.category = filters.category as never;
  if (filters.type && filters.type in EMPLOYMENT_TYPE_LABELS) where.employmentType = filters.type as never;
  if (filters.city && CITIES.includes(filters.city as never)) where.city = filters.city;
  if (filters.salary === "1") where.NOT = { AND: [{ salaryMin: null }, { salaryMax: null }] };

  const jobs = await db.job.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      category: true,
      employmentType: true,
      city: true,
      salaryMin: true,
      salaryMax: true,
      salaryPeriod: true,
      status: true,
      createdAt: true,
      institution: { select: { name: true, handle: true, verified: true, avatarImageId: true } },
    },
  });
  const hasMore = jobs.length > PAGE_SIZE;
  const page = jobs.slice(0, PAGE_SIZE);

  const nextParams = new URLSearchParams(
    Object.entries(filters).filter(([k, v]) => v && k !== "cursor") as [string, string][]
  );
  if (hasMore) nextParams.set("cursor", page[page.length - 1]!.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Nabídky práce</h1>
          <p className="text-sm text-smoke">Gastro pozice z celé republiky. Přihláška profilem za minutu.</p>
        </div>
        {viewer?.kind === "INSTITUTION" && <Button href="/jobs/new">Vystavit pozici</Button>}
      </div>

      {/* Filtry — čistý GET formulář, filtry žijí v URL (sdílitelné) */}
      <form className="grid gap-3 rounded-card border-2 border-vinyl bg-porcelain p-4 shadow-diner sm:grid-cols-2 lg:grid-cols-6" action="/jobs" method="get">
        <Input name="q" defaultValue={filters.q ?? ""} placeholder="Hledat pozici…" aria-label="Hledat" className="lg:col-span-2" />
        <Select name="category" defaultValue={filters.category ?? ""} aria-label="Kategorie">
          <option value="">Všechny profese</option>
          {Object.entries(JOB_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select name="type" defaultValue={filters.type ?? ""} aria-label="Úvazek">
          <option value="">Všechny úvazky</option>
          {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select name="city" defaultValue={filters.city ?? ""} aria-label="Město">
          <option value="">Celá ČR</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-2">
          <Button type="submit" variant="secondary" size="sm" className="flex-1">
            Filtrovat
          </Button>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold lg:col-span-2">
          <input type="checkbox" name="salary" value="1" defaultChecked={filters.salary === "1"} className="size-4 accent-cherry" />
          Jen s uvedenou mzdou
        </label>
      </form>

      {page.length === 0 ? (
        <EmptyState
          title="Nic jsme nenašli"
          description="Zkus upravit filtry — nebo se vrať později, pozice přibývají."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {page.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button href={`/jobs?${nextParams.toString()}`} variant="secondary" size="sm">
                Načíst další
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
