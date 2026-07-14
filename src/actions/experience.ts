"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { sendMail, appUrl } from "@/lib/mail";
import type { FormState } from "./auth";

const MAX_PENDING_PER_PAIR = 3;

const experienceSchema = z.object({
  institutionId: z.string().optional(),
  institutionName: z.string().trim().min(2, "Vyplň název podniku").max(80),
  role: z.string().trim().min(2, "Vyplň pozici").max(80),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, "Vyplň začátek (měsíc a rok)"),
  endDate: z.string().regex(/^\d{4}-\d{2}$/).optional().or(z.literal("")),
  description: z.string().trim().max(1000, "Popis max 1000 znaků").optional(),
});

async function requestVerification(experienceId: string, personName: string, institutionId: string) {
  const institution = await db.user.findUnique({
    where: { id: institutionId },
    select: { id: true, kind: true, name: true, email: true },
  });
  if (!institution || institution.kind !== "INSTITUTION") return { error: "Vybraný účet není podnik." };

  await notify({
    userId: institution.id,
    actorId: (await requireUser()).id,
    type: "EXPERIENCE_REQUEST",
    experienceId,
  });
  await sendMail({
    to: institution.email,
    subject: `Cookus — ${personName} žádá o potvrzení praxe`,
    text: `Ahoj,\n\n${personName} uvádí praxi u vás a žádá o její potvrzení.\nPotvrdit nebo odmítnout ji můžete tady: ${appUrl("/verifications")}\n\nCookus`,
  });
  return null;
}

export async function addExperienceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.kind !== "PERSON") return { error: "Praxi mohou přidávat jen osobní profily." };

  const parsed = experienceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const data = parsed.data;

  const startDate = new Date(`${data.startDate}-01T00:00:00Z`);
  const endDate = data.endDate ? new Date(`${data.endDate}-01T00:00:00Z`) : null;
  if (endDate && endDate < startDate) return { error: "Konec nemůže být před začátkem." };

  let institutionId: string | null = null;
  let institutionName = data.institutionName;
  let status: "UNLINKED" | "PENDING" = "UNLINKED";

  if (data.institutionId) {
    const institution = await db.user.findUnique({
      where: { id: data.institutionId },
      select: { id: true, kind: true, name: true },
    });
    if (!institution || institution.kind !== "INSTITUTION")
      return { error: "Vybraný účet není podnik." };
    const pending = await db.experience.count({
      where: { personId: user.id, institutionId: institution.id, status: "PENDING" },
    });
    if (pending >= MAX_PENDING_PER_PAIR)
      return { error: "U tohoto podniku už máš 3 čekající žádosti." };
    institutionId = institution.id;
    institutionName = institution.name; // snapshot
    status = "PENDING";
  }

  const experience = await db.experience.create({
    data: {
      personId: user.id,
      institutionId,
      institutionName,
      role: data.role,
      startDate,
      endDate,
      description: data.description || null,
      status,
    },
    select: { id: true },
  });

  if (institutionId) {
    const err = await requestVerification(experience.id, user.name, institutionId);
    if (err) return err;
  }

  revalidatePath("/settings");
  revalidatePath(`/p/${user.handle}`);
  return { ok: status === "PENDING" ? "Praxe přidána, podnik dostal žádost o potvrzení." : "Praxe přidána." };
}

export async function linkExperienceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const experienceId = String(formData.get("experienceId") ?? "");
  const institutionId = String(formData.get("institutionId") ?? "");
  if (!experienceId || !institutionId) return { error: "Vyber podnik ze seznamu." };

  const experience = await db.experience.findUnique({
    where: { id: experienceId },
    select: { personId: true, status: true },
  });
  if (!experience || experience.personId !== user.id) return { error: "Záznam nenalezen." };
  if (experience.status === "CONFIRMED" || experience.status === "PENDING")
    return { error: "Tento záznam už je potvrzený nebo čeká na potvrzení." };

  const institution = await db.user.findUnique({
    where: { id: institutionId },
    select: { id: true, kind: true, name: true },
  });
  if (!institution || institution.kind !== "INSTITUTION") return { error: "Vybraný účet není podnik." };

  const pending = await db.experience.count({
    where: { personId: user.id, institutionId, status: "PENDING" },
  });
  if (pending >= MAX_PENDING_PER_PAIR) return { error: "U tohoto podniku už máš 3 čekající žádosti." };

  await db.experience.update({
    where: { id: experienceId },
    data: { institutionId, institutionName: institution.name, status: "PENDING", report: null, respondedAt: null },
  });
  const err = await requestVerification(experienceId, user.name, institutionId);
  if (err) return err;

  revalidatePath("/settings");
  revalidatePath(`/p/${user.handle}`);
  return { ok: "Žádost o potvrzení odeslána." };
}

export async function withdrawExperienceRequestAction(experienceId: string): Promise<void> {
  const user = await requireUser();
  const experience = await db.experience.findUnique({
    where: { id: experienceId },
    select: { personId: true, status: true },
  });
  if (!experience || experience.personId !== user.id || experience.status !== "PENDING") return;
  await db.$transaction([
    db.experience.update({
      where: { id: experienceId },
      data: { status: "UNLINKED", institutionId: null },
    }),
    db.notification.deleteMany({ where: { experienceId, type: "EXPERIENCE_REQUEST", readAt: null } }),
  ]);
  revalidatePath("/settings");
  revalidatePath(`/p/${user.handle}`);
}

export async function deleteExperienceAction(experienceId: string): Promise<void> {
  const user = await requireUser();
  await db.experience.deleteMany({ where: { id: experienceId, personId: user.id } });
  revalidatePath("/settings");
  revalidatePath(`/p/${user.handle}`);
}

const confirmSchema = z.object({
  experienceId: z.string().min(1),
  report: z.string().trim().max(1000, "Report max 1000 znaků").optional(),
});

export async function confirmExperienceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = confirmSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };

  const experience = await db.experience.findUnique({
    where: { id: parsed.data.experienceId },
    select: { id: true, institutionId: true, status: true, personId: true, person: { select: { handle: true } } },
  });
  if (!experience || experience.institutionId !== user.id || experience.status !== "PENDING")
    return { error: "Žádost nenalezena." };

  await db.experience.update({
    where: { id: experience.id },
    data: { status: "CONFIRMED", report: parsed.data.report || null, respondedAt: new Date() },
  });
  await notify({
    userId: experience.personId,
    actorId: user.id,
    type: "EXPERIENCE_CONFIRMED",
    experienceId: experience.id,
  });

  revalidatePath("/verifications");
  revalidatePath(`/p/${experience.person.handle}`);
  return { ok: "Praxe potvrzena." };
}

export async function declineExperienceAction(experienceId: string): Promise<void> {
  const user = await requireUser();
  const experience = await db.experience.findUnique({
    where: { id: experienceId },
    select: { id: true, institutionId: true, status: true, personId: true, person: { select: { handle: true } } },
  });
  if (!experience || experience.institutionId !== user.id || experience.status !== "PENDING") return;

  await db.experience.update({
    where: { id: experience.id },
    data: { status: "DECLINED", respondedAt: new Date() },
  });
  await notify({
    userId: experience.personId,
    actorId: user.id,
    type: "EXPERIENCE_DECLINED",
    experienceId: experience.id,
  });

  revalidatePath("/verifications");
  revalidatePath(`/p/${experience.person.handle}`);
}
