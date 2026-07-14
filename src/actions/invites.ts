"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { sendMail, appUrl } from "@/lib/mail";
import type { FormState } from "./auth";

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Zadej platný e-mail"),
  message: z.string().trim().max(500, "Vzkaz max 500 znaků").optional(),
});

export async function createInviteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const { email, message } = parsed.data;

  const existingUser = await db.user.findUnique({ where: { email }, select: { handle: true } });
  if (existingUser)
    return { error: "Tenhle e-mail už na Cookus účet má — zkus ho najít v Lidech a přidat do přátel." };

  const existingInvite = await db.invitation.findFirst({
    where: { inviterId: user.id, email, acceptedAt: null },
    select: { id: true },
  });
  if (existingInvite)
    return { ok: "Na tenhle e-mail už tvoje pozvánka čeká — odkaz najdeš v seznamu níže." };

  if (!(await rateLimit(`invite:${user.id}`, 20, 86400)))
    return { error: "Limit 20 pozvánek za den vyčerpán. Zkus to zítra." };

  const invitation = await db.invitation.create({
    data: { inviterId: user.id, email, message: message || null },
    select: { id: true },
  });

  const link = appUrl(`/register?invite=${invitation.id}`);
  await sendMail({
    to: email,
    subject: `${user.name} tě zve na Cookus`,
    text: `Ahoj!\n\n${user.name} tě zve na Cookus — profesní síť pro gastro. Profil místo životopisu, praxe ověřená podniky, práce na pár kliknutí.${message ? `\n\nVzkaz od ${user.name}:\n„${message}“` : ""}\n\nZaregistruj se tady: ${link}\n\nGastro žije tady.\nCookus`,
  });

  revalidatePath("/invite");
  return { ok: "Pozvánka odeslána! Odkaz můžeš poslat i sám/sama — je v seznamu níže." };
}

export async function cancelInviteAction(invitationId: string): Promise<void> {
  const user = await requireUser();
  await db.invitation.deleteMany({
    where: { id: invitationId, inviterId: user.id, acceptedAt: null },
  });
  revalidatePath("/invite");
}
