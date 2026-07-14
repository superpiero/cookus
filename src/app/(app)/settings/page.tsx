import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { CITIES } from "@/lib/const";
import { Card } from "@/components/ui/Card";
import { AvatarUploader } from "@/components/settings/AvatarUploader";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { SkillsManager } from "@/components/settings/SkillsManager";
import { ExperienceManager, type ExperienceItem } from "@/components/settings/ExperienceManager";
import { DeleteAccount } from "@/components/settings/DeleteAccount";

export const metadata: Metadata = { title: "Nastavení" };

function toMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/settings");
  const { welcome } = await searchParams;

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.id },
    select: {
      kind: true,
      name: true,
      handle: true,
      headline: true,
      bio: true,
      city: true,
      website: true,
      openToWork: true,
      avatarImageId: true,
      skills: { orderBy: { position: "asc" }, select: { id: true, name: true } },
      experiencesAsPerson: {
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
        },
      },
    },
  });

  const experiences: ExperienceItem[] = user.experiencesAsPerson.map((e) => ({
    ...e,
    startDate: toMonth(e.startDate),
    endDate: e.endDate ? toMonth(e.endDate) : null,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {welcome && (
        <Card className="border-teal p-4">
          <p className="font-script text-lg text-teal">Vítej v Cookus! 🎉</p>
          <p className="text-sm">
            Dokonči profil — avatar, headline a pár dovedností. Profil s fotkou dostává výrazně víc odpovědí.
          </p>
        </Card>
      )}

      <h1 className="font-display text-3xl">Nastavení profilu</h1>

      <Card className="p-5">
        <h2 className="mb-4 font-display text-xl">Avatar</h2>
        <AvatarUploader name={user.name} avatarImageId={user.avatarImageId} />
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-display text-xl">Základní údaje</h2>
        <ProfileForm profile={user} cities={CITIES} />
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-display text-xl">Dovednosti</h2>
        <SkillsManager skills={user.skills} />
      </Card>

      {user.kind === "PERSON" && (
        <Card className="p-5">
          <h2 className="mb-1 font-display text-xl">Praxe</h2>
          <p className="mb-4 text-sm text-smoke">
            Záznamy propojené s účtem podniku můžou získat badge{" "}
            <span className="font-bold text-teal">✓ Ověřeno podnikem</span> — to je na Cookus největší devíza.
          </p>
          <ExperienceManager items={experiences} />
        </Card>
      )}

      <Card className="border-dashed p-5">
        <h2 className="mb-3 font-display text-xl">Nebezpečná zóna</h2>
        <DeleteAccount />
      </Card>
    </div>
  );
}
