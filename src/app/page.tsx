import Link from "next/link";
import { BadgeCheck, Camera, Heart, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Sparkle } from "@/components/ui/EmptyState";
import { JobCard } from "@/components/jobs/JobCard";
import { HowItWorks } from "@/components/home/HowItWorks";

// ISR — čísla a pozice se obnovují po 5 minutách; Neon cold start neblokuje LCP (docs/04 #20)
export const revalidate = 300;

const PERSONAS = [
  {
    name: "Kuchař Karel",
    role: "8 let za plotnou, nesnáší psát CV",
    quote: "„Místo životopisu pošlu profil. Reference od bývalých šéfů mluví samy.“",
    benefit: "Ověřená praxe + portfolio jídel",
  },
  {
    name: "Barmanka Bára",
    role: "studentka, hledá brigády",
    quote: "„Filtr na brigády v Brně, přihláška na dva kliky. Hotovo cestou v tramvaji.“",
    benefit: "Přihláška profilem za minutu",
  },
  {
    name: "Šéfová Simona",
    role: "provozní bistra, nabírá průběžně",
    quote: "„Vidím, kde kdo fakt pracoval a co o něm napsali. To mi žádný portál nedal.“",
    benefit: "Uchazeči s ověřenou praxí",
  },
];

export default async function HomePage() {
  const viewer = await getSessionUser();

  const [personCount, institutionCount, jobCount, latestJobs] = await Promise.all([
    db.user.count({ where: { kind: "PERSON" } }),
    db.user.count({ where: { kind: "INSTITUTION" } }),
    db.job.count({ where: { status: "OPEN" } }),
    db.job.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 3,
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
    }),
  ]);

  // Sociální důkaz až nad prahem důvěryhodnosti (docs/04 #12)
  const showStats = personCount >= 50 && institutionCount >= 10 && jobCount >= 10;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Nav */}
      <header className="border-b-2 border-vinyl bg-vanilla">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <Logo size="sm" />
          <nav className="ml-2 hidden gap-1 sm:flex" aria-label="Hlavní navigace">
            <Link href="/jobs" className="rounded-full px-3 py-1.5 text-sm font-extrabold hover:bg-chrome-light">
              Práce
            </Link>
            <Link href="/people" className="rounded-full px-3 py-1.5 text-sm font-extrabold hover:bg-chrome-light">
              Lidé
            </Link>
          </nav>
          <div className="ml-auto flex gap-2">
            {viewer ? (
              <Button href="/feed" size="sm">
                Do aplikace
              </Button>
            ) : (
              <>
                <Button href="/login" variant="ghost" size="sm">
                  Přihlásit
                </Button>
                <Button href="/register" size="sm">
                  Registrace
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="checker h-3" aria-hidden />

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <p className="font-script text-2xl text-cherry">Gastro žije tady.</p>
            <h1 className="font-display mt-2 text-4xl leading-[1.08] sm:text-5xl">
              Práce v gastru
              <br />
              bez životopisu.
            </h1>
            <p className="mt-4 max-w-md text-lg">
              Profil, který za tebe mluví: <b>praxe ověřená podniky</b>, fotky tvojí práce a přihláška na pozici
              za minutu. Pro kuchaře, baristy, barmany — i pro podniky, které je hledají.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/register?kind=person" size="lg">
                Hledám práci
              </Button>
              <Button href="/register?kind=institution" variant="secondary" size="lg">
                Hledáme lidi
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-smoke">
              <li>✓ Zdarma</li>
              <li>✓ Reference ověřené podniky</li>
              <li>✓ Přihláška za minutu</li>
            </ul>
            {showStats && (
              <p className="mt-5 text-sm font-bold tabular-nums">
                {personCount} lidí z gastra · {institutionCount} podniků · {jobCount} otevřených pozic
              </p>
            )}
          </div>

          {/* Product mock — ukázka toho, co si uživatel kupuje */}
          <div className="relative mx-auto w-full max-w-sm" aria-hidden>
            <Sparkle className="absolute -left-6 -top-6 size-8 rotate-12" />
            <Card className="rotate-[-2deg] p-4">
              <div className="flex items-center gap-3">
                <Avatar name="Karel Dvořák" size="lg" />
                <div>
                  <div className="font-extrabold">Karel Dvořák</div>
                  <div className="text-sm text-smoke">Sous chef · Praha</div>
                </div>
                <Badge variant="mustard" className="ml-auto">
                  Hledám práci
                </Badge>
              </div>
              <div className="mt-3 rounded-card border-2 border-chrome bg-vanilla p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold">Sous chef · Bistro U Chroma</span>
                  <Badge variant="teal">
                    <BadgeCheck className="size-3.5" /> Ověřeno
                  </Badge>
                </div>
                <p className="mt-1.5 border-l-3 border-teal pl-2 text-xs italic">
                  „Karel táhl večerní servis i při plné rezervaci. Kdykoli znovu.“
                </p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {["bg-cherry", "bg-mustard", "bg-teal"].map((bg, i) => (
                  <div key={i} className={`aspect-square rounded-photo border-2 border-vinyl ${bg} opacity-80`} />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-3 text-sm font-bold text-smoke">
                <span className="inline-flex items-center gap-1">
                  <Heart className="size-4 fill-cherry stroke-cherry" /> 47
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="size-4" /> 12
                </span>
                <span className="inline-flex items-center gap-1">
                  <Camera className="size-4" /> portfolio
                </span>
              </div>
            </Card>
            <Card className="absolute -bottom-8 -right-2 w-56 rotate-[2.5deg] p-3 max-lg:hidden">
              <p className="text-xs font-bold">Bistro U Chroma</p>
              <p className="rounded-card border-2 border-vinyl bg-cherry px-2.5 py-1.5 text-xs text-white">
                Jasně, počítáme s tebou 🔥
              </p>
            </Card>
          </div>
        </section>

        <div className="checker h-3" aria-hidden />

        {/* ============ JAK TO FUNGUJE ============ */}
        <section className="mx-auto max-w-5xl px-4 py-14">
          <p className="text-center font-script text-xl text-cherry">jak to funguje</p>
          <h2 className="font-display mb-8 text-center text-3xl">Tři kroky a jedeš</h2>
          <HowItWorks />
        </section>

        {/* ============ DIFFERENTIATOR ============ */}
        <section className="bg-vinyl py-14 text-vanilla">
          <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 lg:grid-cols-2">
            <div>
              <p className="font-script text-xl text-mustard">tohle jinde nenajdeš</p>
              <h2 className="font-display mt-1 text-3xl">Reference, kterým se dá věřit</h2>
              <p className="mt-3 max-w-md text-vanilla/85">
                Praxi ti potvrzuje přímo podnik, kde jsi pracoval/a — i s krátkým reportem. Žádné vymyšlené
                řádky v CV. Pro podniky to znamená jediné: <b>vybíráte z lidí, za které se někdo zaručil.</b>
              </p>
              <div className="mt-5">
                <Button href="/register" size="md">
                  Chci ověřený profil
                </Button>
              </div>
            </div>
            <Card className="p-4 text-vinyl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar name="Bára Malá" size="md" />
                  <div>
                    <div className="text-sm font-extrabold">Bára Malá</div>
                    <div className="text-xs text-smoke">Barmanka · Brno</div>
                  </div>
                </div>
                <Badge variant="teal">
                  <BadgeCheck className="size-3.5" /> Ověřeno podnikem
                </Badge>
              </div>
              <div className="mt-3 rounded-card border-2 border-chrome bg-vanilla p-3 text-sm">
                <p className="font-extrabold">Barmanka · Bar Chrom & Pomáda</p>
                <p className="text-xs text-smoke">2024–2026 · potvrzeno podnikem</p>
                <blockquote className="mt-2 border-l-3 border-teal pl-3 text-xs italic">
                  „Nejrychlejší ruce na baru, co jsme kdy měli. Hosté si ji pamatují jménem.“
                </blockquote>
              </div>
            </Card>
          </div>
        </section>

        {/* ============ PERSONY ============ */}
        <section className="mx-auto max-w-5xl px-4 py-14">
          <p className="text-center font-script text-xl text-cherry">pro koho to je</p>
          <h2 className="font-display mb-8 text-center text-3xl">Celá gastroscéna na jednom místě</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {PERSONAS.map((persona) => (
              <Card key={persona.name} className="p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={persona.name.split(" ")[1] ?? persona.name} size="md" />
                  <div>
                    <h3 className="font-extrabold">{persona.name}</h3>
                    <p className="text-xs text-smoke">{persona.role}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm italic">{persona.quote}</p>
                <Badge variant="mustard" className="mt-3">
                  {persona.benefit}
                </Badge>
              </Card>
            ))}
          </div>
        </section>

        {/* ============ POSLEDNÍ POZICE ============ */}
        {latestJobs.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 pb-14">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="font-script text-xl text-cherry">právě teď</p>
                <h2 className="font-display text-3xl">Čerstvé pozice</h2>
              </div>
              <Button href="/jobs" variant="secondary" size="sm">
                Všechny pozice →
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {latestJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        )}

        {/* ============ ZÁVĚREČNÉ CTA ============ */}
        <section className="bg-cherry py-16 text-center text-white">
          <div className="mx-auto max-w-2xl px-4">
            <p className="font-script text-2xl text-mustard">tak co, jdeš do toho?</p>
            <h2 className="font-display mt-2 text-4xl">Tvůj profil tě může živit.</h2>
            <p className="mt-3 text-white/90">Registrace zabere minutu. Životopis už nikdy psát nemusíš.</p>
            <div className="mt-7 flex justify-center gap-3">
              <Button href="/register?kind=person" variant="secondary" size="lg">
                Hledám práci
              </Button>
              <Button
                href="/register?kind=institution"
                size="lg"
                className="!bg-vinyl !text-vanilla"
              >
                Hledáme lidi
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-vinyl bg-vinyl text-vanilla">
        <div className="checker h-3" aria-hidden />
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-8">
          <Logo size="sm" href="/" inverse />
          <nav className="flex flex-wrap gap-5 text-sm" aria-label="Patička">
            <Link href="/jobs" className="hover:underline">
              Nabídky práce
            </Link>
            <Link href="/people" className="hover:underline">
              Lidé z gastra
            </Link>
            <Link href="/register" className="hover:underline">
              Registrace
            </Link>
            <Link href="/privacy" className="hover:underline">
              Ochrana údajů
            </Link>
          </nav>
          <p className="text-xs text-vanilla/60">© {new Date().getFullYear()} Cookus</p>
        </div>
      </footer>
    </div>
  );
}
