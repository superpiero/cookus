import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Globe, MapPin, MessageCircle, Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getFriendshipState } from "@/lib/friends";
import { startConversationAction } from "@/actions/messages";
import { FriendButton, PokeButton } from "@/components/friends/FriendButtons";
import { INSTITUTION_CATEGORY_LABELS } from "@/lib/const";
import { formatMonthYear } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { JobCard } from "@/components/jobs/JobCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const user = await db.user.findUnique({ where: { handle }, select: { name: true, headline: true } });
  if (!user) return { title: "Profil nenalezen" };
  return { title: user.name, description: user.headline ?? undefined };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { handle } = await params;
  const { tab } = await searchParams;
  const viewer = await getSessionUser();

  const user = await db.user.findUnique({
    where: { handle },
    select: {
      id: true,
      kind: true,
      name: true,
      handle: true,
      headline: true,
      bio: true,
      city: true,
      website: true,
      openToWork: true,
      category: true,
      verified: true,
      isBlocked: true,
      avatarImageId: true,
      skills: { orderBy: { position: "asc" }, select: { id: true, name: true } },
      _count: { select: { posts: true } },
    },
  });
  if (!user || user.isBlocked) notFound();

  const isOwner = viewer?.id === user.id;
  const isPerson = user.kind === "PERSON";
  const activeTab = tab ?? "fotky";
  const friendship = viewer && !isOwner ? await getFriendshipState(viewer.id, user.id) : null;

  const tabItems = [
    { href: `/p/${handle}`, label: "Fotky", active: activeTab === "fotky", count: user._count.posts },
    { href: `/p/${handle}?tab=praxe`, label: isPerson ? "Praxe" : "Lidé od nás", active: activeTab === "praxe" },
    { href: `/p/${handle}?tab=info`, label: "Info", active: activeTab === "info" },
    ...(!isPerson
      ? [{ href: `/p/${handle}?tab=pozice`, label: "Pozice", active: activeTab === "pozice" }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Hlavička profilu */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={user.name} imageId={user.avatarImageId} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl leading-tight">{user.name}</h1>
              {user.verified && (
                <Badge variant="teal">
                  <BadgeCheck className="size-3.5" /> Ověřený podnik
                </Badge>
              )}
              {isPerson && user.openToWork && <Badge variant="mustard">Hledám práci</Badge>}
            </div>
            {user.headline && <p className="mt-1 text-lg">{user.headline}</p>}
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-smoke">
              <span>@{user.handle}</span>
              {!isPerson && user.category && <span>{INSTITUTION_CATEGORY_LABELS[user.category]}</span>}
              {user.city && (
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="size-3.5" aria-hidden /> {user.city}
                </span>
              )}
              {user.website && (
                <a
                  href={user.website}
                  rel="noopener noreferrer nofollow"
                  target="_blank"
                  className="inline-flex items-center gap-0.5 underline"
                >
                  <Globe className="size-3.5" aria-hidden /> web
                </a>
              )}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {isOwner && (
              <Button href="/settings" variant="secondary" size="sm">
                <Pencil className="size-4" /> Upravit profil
              </Button>
            )}
            {viewer && !isOwner && (
              <>
                <form action={startConversationAction.bind(null, user.id)}>
                  <Button type="submit" size="sm">
                    <MessageCircle className="size-4" /> Napsat zprávu
                  </Button>
                </form>
                {friendship && <FriendButton targetId={user.id} initial={friendship} />}
                <PokeButton targetId={user.id} />
              </>
            )}
            {!viewer && (
              <Button href={`/login?next=/p/${handle}`} size="sm">
                <MessageCircle className="size-4" /> Napsat zprávu
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Tabs items={tabItems} />

      {activeTab === "fotky" && <PhotosTab userId={user.id} isOwner={isOwner} />}
      {activeTab === "praxe" &&
        (isPerson ? (
          <PersonExperienceTab userId={user.id} isOwner={isOwner} />
        ) : (
          <InstitutionExperienceTab userId={user.id} />
        ))}
      {activeTab === "info" && <InfoTab bio={user.bio} skills={user.skills} isOwner={isOwner} />}
      {activeTab === "pozice" && !isPerson && <JobsTab userId={user.id} isOwner={isOwner} />}
    </div>
  );
}

async function PhotosTab({ userId, isOwner }: { userId: string; isOwner: boolean }) {
  const posts = await db.post.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, imageId: true, caption: true },
    take: 60,
  });
  if (posts.length === 0) {
    return (
      <EmptyState
        title="Zatím žádné fotky"
        description={isOwner ? "Přidej první fotku svého jídla a ukaž, co umíš." : "Tenhle profil zatím nic nesdílel."}
        action={isOwner ? <Button href="/post/new" size="sm">Přidat fotku</Button> : undefined}
      />
    );
  }
  return (
    <ul className="grid grid-cols-3 gap-1.5 sm:gap-3">
      {posts.map((post) => (
        <li key={post.id}>
          <Link href={`/post/${post.id}`} className="group block overflow-hidden rounded-photo border-2 border-vinyl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/img/${post.imageId}`}
              alt={post.caption ?? "Fotka"}
              loading="lazy"
              className="aspect-square w-full object-cover transition group-hover:scale-[1.03]"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function PersonExperienceTab({ userId, isOwner }: { userId: string; isOwner: boolean }) {
  const experiences = await db.experience.findMany({
    where: { personId: userId, status: { in: ["UNLINKED", "PENDING", "CONFIRMED"] } },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      institutionName: true,
      role: true,
      startDate: true,
      endDate: true,
      description: true,
      status: true,
      report: true,
      institution: { select: { handle: true, verified: true } },
    },
  });
  if (experiences.length === 0) {
    return (
      <EmptyState
        title="Zatím žádná praxe"
        description={isOwner ? "Přidej svoji praxi v nastavení — a nech si ji ověřit podnikem." : undefined}
        action={isOwner ? <Button href="/settings" size="sm">Přidat praxi</Button> : undefined}
      />
    );
  }
  return (
    <ul className="space-y-3">
      {experiences.map((exp) => {
        const confirmed = exp.status === "CONFIRMED";
        return (
          <Card key={exp.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-extrabold">
                  {exp.role} ·{" "}
                  {confirmed && exp.institution ? (
                    <Link href={`/p/${exp.institution.handle}`} className="underline">
                      {exp.institutionName}
                    </Link>
                  ) : (
                    exp.institutionName
                  )}
                </h3>
                <p className="text-sm text-smoke">
                  {formatMonthYear(exp.startDate)} – {exp.endDate ? formatMonthYear(exp.endDate) : "dosud"}
                </p>
              </div>
              {confirmed ? (
                <Badge variant="teal">
                  <BadgeCheck className="size-3.5" /> Ověřeno podnikem
                </Badge>
              ) : (
                <Badge variant="outline">Neověřeno</Badge>
              )}
            </div>
            {exp.description && <p className="mt-2 text-sm">{exp.description}</p>}
            {confirmed && exp.report && (
              <blockquote className="mt-2 border-l-3 border-teal pl-3 text-sm italic">„{exp.report}“</blockquote>
            )}
          </Card>
        );
      })}
    </ul>
  );
}

async function InstitutionExperienceTab({ userId }: { userId: string }) {
  const experiences = await db.experience.findMany({
    where: { institutionId: userId, status: "CONFIRMED" },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      role: true,
      startDate: true,
      endDate: true,
      report: true,
      person: { select: { name: true, handle: true, avatarImageId: true } },
    },
  });
  if (experiences.length === 0) {
    return <EmptyState title="Zatím žádní potvrzení lidé" description="Až podnik potvrdí něčí praxi, objeví se tady." />;
  }
  return (
    <ul className="space-y-3">
      {experiences.map((exp) => (
        <Card key={exp.id} className="p-4">
          <div className="flex items-center gap-3">
            <Avatar name={exp.person.name} imageId={exp.person.avatarImageId} size="md" />
            <div className="min-w-0">
              <Link href={`/p/${exp.person.handle}`} className="font-extrabold underline">
                {exp.person.name}
              </Link>
              <p className="text-sm text-smoke">
                {exp.role} · {formatMonthYear(exp.startDate)} – {exp.endDate ? formatMonthYear(exp.endDate) : "dosud"}
              </p>
            </div>
          </div>
          {exp.report && <blockquote className="mt-2 border-l-3 border-teal pl-3 text-sm italic">„{exp.report}“</blockquote>}
        </Card>
      ))}
    </ul>
  );
}

function InfoTab({
  bio,
  skills,
  isOwner,
}: {
  bio: string | null;
  skills: { id: string; name: string }[];
  isOwner: boolean;
}) {
  if (!bio && skills.length === 0) {
    return (
      <EmptyState
        title="Zatím žádné info"
        description={isOwner ? "Doplň bio a dovednosti v nastavení." : undefined}
        action={isOwner ? <Button href="/settings" size="sm">Doplnit profil</Button> : undefined}
      />
    );
  }
  return (
    <div className="space-y-4">
      {bio && (
        <Card className="p-5">
          <h3 className="mb-2 font-display text-lg">Bio</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{bio}</p>
        </Card>
      )}
      {skills.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 font-display text-lg">Dovednosti</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill.id}>{skill.name}</Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

async function JobsTab({ userId, isOwner }: { userId: string; isOwner: boolean }) {
  const jobs = await db.job.findMany({
    where: { institutionId: userId, ...(isOwner ? {} : { status: "OPEN" }) },
    orderBy: { createdAt: "desc" },
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
  if (jobs.length === 0) {
    return (
      <EmptyState
        title="Žádné otevřené pozice"
        description={isOwner ? "Vystav první inzerát a najdi posily." : undefined}
        action={isOwner ? <Button href="/jobs/new" size="sm">Vystavit pozici</Button> : undefined}
      />
    );
  }
  return (
    <div className="space-y-3">
      {isOwner && (
        <div className="flex justify-end">
          <Button href="/jobs/new" size="sm">
            Vystavit pozici
          </Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
