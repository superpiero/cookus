"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, requireUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { slugifyHandle, isValidHandle } from "@/lib/handles";
import { sendMail, appUrl } from "@/lib/mail";
import type { InstitutionCategory } from "@prisma/client";

export type FormState = { error?: string; ok?: string } | null;

const registerSchema = z.object({
  kind: z.enum(["PERSON", "INSTITUTION"]),
  name: z.string().trim().min(2, "Vyplň jméno (min. 2 znaky)").max(80),
  email: z.string().trim().toLowerCase().email("Zadej platný e-mail"),
  password: z.string().min(8, "Heslo musí mít aspoň 8 znaků").max(200),
  category: z.string().optional(),
  invite: z.string().optional(),
});

/** Přijetí pozvánky po registraci: označí ji a pošle novému účtu žádost o přátelství od zvoucího. */
async function acceptInvitation(invitationId: string, newUserId: string): Promise<void> {
  try {
    const invitation = await db.invitation.findUnique({
      where: { id: invitationId },
      select: { id: true, inviterId: true, acceptedAt: true },
    });
    if (!invitation || invitation.acceptedAt || invitation.inviterId === newUserId) return;

    await db.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date(), acceptedById: newUserId },
    });
    const friendship = await db.friendship.create({
      data: { requesterId: invitation.inviterId, addresseeId: newUserId },
      select: { id: true },
    });
    const { notify } = await import("@/lib/notify");
    await notify({
      userId: newUserId,
      actorId: invitation.inviterId,
      type: "FRIEND_REQUEST",
      friendshipId: friendship.id,
    });
  } catch (err) {
    // pozvánka nesmí nikdy shodit registraci
    console.error("[invite:accept]", err);
  }
}

async function uniqueHandle(name: string): Promise<string> {
  const base = slugifyHandle(name);
  let candidate = isValidHandle(base) ? base : `${base}-1`;
  for (let i = 2; i < 100; i++) {
    const existing = await db.user.findUnique({ where: { handle: candidate }, select: { id: true } });
    if (!existing && isValidHandle(candidate)) return candidate;
    candidate = `${base}-${i}`.slice(0, 30);
  }
  return `${base.slice(0, 20)}-${randomBytes(3).toString("hex")}`;
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const { kind, name, email, password, category, invite } = parsed.data;

  if (!(await rateLimit(`register:${await clientIp()}`, 5, 3600)))
    return { error: "Příliš mnoho registrací. Zkus to prosím za hodinu." };

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { error: "Tenhle e-mail už u nás účet má. Zkus se přihlásit." };

  const validCategory =
    kind === "INSTITUTION" && category ? (category as InstitutionCategory) : null;

  const user = await db.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      kind,
      name,
      handle: await uniqueHandle(name),
      category: validCategory,
    },
    select: { id: true, kind: true },
  });

  if (invite) await acceptInvitation(invite, user.id);

  await createSession(user.id, user.kind);
  redirect("/settings?welcome=1");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Zadej platný e-mail"),
  password: z.string().min(1, "Zadej heslo"),
  next: z.string().optional(),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const { email, password, next } = parsed.data;

  if (!(await rateLimit(`login:${await clientIp()}`, 10, 900)))
    return { error: "Příliš mnoho pokusů. Zkus to za 15 minut." };

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, kind: true, passwordHash: true, isBlocked: true },
  });
  const genericError = { error: "Nesprávný e-mail nebo heslo." };
  if (!user) return genericError;
  if (!(await bcrypt.compare(password, user.passwordHash))) return genericError;
  if (user.isBlocked) return genericError;

  await createSession(user.id, user.kind);
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/feed";
  redirect(target);
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Zadej platný e-mail." };

  if (!(await rateLimit(`reset:${await clientIp()}`, 5, 3600)))
    return { error: "Příliš mnoho žádostí. Zkus to za hodinu." };

  const user = await db.user.findUnique({ where: { email: email.data }, select: { id: true } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });
    await sendMail({
      to: email.data,
      subject: "Cookus — obnova hesla",
      text: `Ahoj!\n\nNěkdo (snad ty) požádal o obnovu hesla. Odkaz platí hodinu:\n${appUrl(`/reset-password?token=${token}`)}\n\nPokud jsi to nebyl/a ty, tenhle e-mail klidně ignoruj.`,
    });
  }
  // Vždy stejná odpověď — nechceme prozrazovat existenci e-mailu při resetu.
  return { ok: "Pokud e-mail známe, poslali jsme na něj odkaz pro obnovu hesla." };
}

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Heslo musí mít aspoň 8 znaků").max(200),
});

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date())
    return { error: "Odkaz je neplatný nebo vypršel. Vyžádej si nový." };

  await db.$transaction([
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) },
    }),
  ]);
  redirect("/login?reset=1");
}

export async function deleteAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const password = String(formData.get("password") ?? "");
  const record = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !(await bcrypt.compare(password, record.passwordHash)))
    return { error: "Nesprávné heslo." };
  await db.user.delete({ where: { id: user.id } }); // cascade dle schématu (docs/02 §2.1)
  await destroySession();
  redirect("/?deleted=1");
}
