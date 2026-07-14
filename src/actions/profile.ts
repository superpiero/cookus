"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CITIES, MAX_SKILLS } from "@/lib/const";
import { isValidHandle } from "@/lib/handles";
import type { FormState } from "./auth";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Jméno musí mít aspoň 2 znaky").max(80),
  handle: z.string().trim().toLowerCase(),
  headline: z.string().trim().max(120, "Headline max 120 znaků").optional(),
  bio: z.string().trim().max(2000, "Bio max 2000 znaků").optional(),
  city: z.string().optional(),
  website: z.string().trim().url("Zadej platnou URL (včetně https://)").max(200).optional().or(z.literal("")),
  openToWork: z.string().optional(),
});

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const data = parsed.data;

  if (!isValidHandle(data.handle))
    return { error: "Adresa profilu smí mít 3–30 znaků: malá písmena, číslice, pomlčky." };
  const handleTaken = await db.user.findFirst({
    where: { handle: data.handle, NOT: { id: user.id } },
    select: { id: true },
  });
  if (handleTaken) return { error: "Tahle adresa profilu je už obsazená." };

  if (data.city && !CITIES.includes(data.city as never)) return { error: "Neplatné město." };

  await db.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      handle: data.handle,
      headline: data.headline || null,
      bio: data.bio || null,
      city: data.city || null,
      website: user.kind === "INSTITUTION" ? data.website || null : undefined,
      openToWork: user.kind === "PERSON" ? data.openToWork === "on" : undefined,
    },
  });

  revalidatePath(`/p/${data.handle}`);
  revalidatePath("/settings");
  return { ok: "Profil uložen." };
}

export async function setAvatarAction(imageId: string): Promise<FormState> {
  const user = await requireUser();
  const image = await db.imageBlob.findUnique({ where: { id: imageId }, select: { ownerId: true } });
  if (!image || image.ownerId !== user.id) return { error: "Obrázek nenalezen." };
  await db.user.update({ where: { id: user.id }, data: { avatarImageId: imageId } });
  revalidatePath("/settings");
  revalidatePath(`/p/${user.handle}`);
  return { ok: "Avatar nastaven." };
}

export async function addSkillAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = z.string().trim().min(2, "Min. 2 znaky").max(40, "Max 40 znaků").safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0]!.message };

  const count = await db.skill.count({ where: { userId: user.id } });
  if (count >= MAX_SKILLS) return { error: `Maximum je ${MAX_SKILLS} dovedností.` };

  try {
    await db.skill.create({ data: { userId: user.id, name: name.data, position: count } });
  } catch {
    return { error: "Tuhle dovednost už na profilu máš." };
  }
  revalidatePath("/settings");
  revalidatePath(`/p/${user.handle}`);
  return { ok: "Přidáno." };
}

export async function removeSkillAction(skillId: string): Promise<void> {
  const user = await requireUser();
  await db.skill.deleteMany({ where: { id: skillId, userId: user.id } });
  revalidatePath("/settings");
  revalidatePath(`/p/${user.handle}`);
}
