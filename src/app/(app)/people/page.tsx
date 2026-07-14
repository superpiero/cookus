import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { CITIES } from "@/lib/const";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { BadgeCheck, MapPin } from "lucide-react";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Lidé z gastra",
  description: "Kuchaři, baristi, barmani a další profíci. Najdi posily podle dovedností a města.",
};

const PAGE_SIZE = 18;

type Filters = { skill?: string; city?: string; openToWork?: string; cursor?: string };

export default async function PeoplePage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = await searchParams;

  const where: Prisma.UserWhereInput = { kind: "PERSON", isBlocked: false };
  if (filters.openToWork === "1") where.openToWork = true;
  if (filters.city && CITIES.includes(filters.city as never)) where.city = filters.city;
  if (filters.skill) where.skills = { some: { name: { contains: filters.skill, mode: "insensitive" } } };

  const people = await db.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      name: true,
      handle: true,
      headline: true,
      city: true,
      openToWork: true,
      avatarImageId: true,
      skills: { orderBy: { position: "asc" }, take: 4, select: { id: true, name: true } },
      _count: { select: { experiencesAsPerson: { where: { status: "CONFIRMED" } } } },
    },
  });
  const hasMore = people.length > PAGE_SIZE;
  const page = people.slice(0, PAGE_SIZE);

  const nextParams = new URLSearchParams(
    Object.entries(filters).filter(([k, v]) => v && k !== "cursor") as [string, string][]
  );
  if (hasMore) nextParams.set("cursor", page[page.length - 1]!.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl">Lidé z gastra</h1>
        <p className="text-sm text-smoke">Hledáš posily? Filtruj podle dovedností, města a dostupnosti.</p>
      </div>

      <form className="grid gap-3 rounded-card border-2 border-vinyl bg-porcelain p-4 shadow-diner sm:grid-cols-4" action="/people" method="get">
        <Input name="skill" defaultValue={filters.skill ?? ""} placeholder="Dovednost (např. latte art)" aria-label="Dovednost" />
        <Select name="city" defaultValue={filters.city ?? ""} aria-label="Město">
          <option value="">Celá ČR</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="openToWork" value="1" defaultChecked={filters.openToWork === "1"} className="size-4 accent-cherry" />
          Jen „hledám práci“
        </label>
        <Button type="submit" variant="secondary" size="sm">
          Filtrovat
        </Button>
      </form>

      {page.length === 0 ? (
        <EmptyState title="Nikoho jsme nenašli" description="Zkus volnější filtry." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.map((person) => (
              <Card key={person.id} interactive className="relative p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={person.name} imageId={person.avatarImageId} size="lg" />
                  <div className="min-w-0">
                    <h3 className="truncate font-extrabold">
                      <Link href={`/p/${person.handle}`} className="after:absolute after:inset-0">
                        {person.name}
                      </Link>
                    </h3>
                    {person.headline && <p className="truncate text-sm text-smoke">{person.headline}</p>}
                    {person.city && (
                      <p className="mt-0.5 inline-flex items-center gap-0.5 text-xs text-smoke">
                        <MapPin className="size-3" aria-hidden /> {person.city}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {person.openToWork && <Badge variant="mustard">Hledám práci</Badge>}
                  {person._count.experiencesAsPerson > 0 && (
                    <Badge variant="teal">
                      <BadgeCheck className="size-3.5" /> {person._count.experiencesAsPerson}× ověřeno
                    </Badge>
                  )}
                  {person.skills.map((skill) => (
                    <Badge key={skill.id} variant="outline">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button href={`/people?${nextParams.toString()}`} variant="secondary" size="sm">
                Načíst další
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
