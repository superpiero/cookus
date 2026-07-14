import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "./db";
import type { UserKind } from "@prisma/client";

const COOKIE_NAME = "cookus_session";
const MAX_AGE_S = 60 * 60 * 24 * 30; // 30 dní

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET není nastaven");
  return new TextEncoder().encode(s);
}

export type SessionPayload = { sub: string; kind: UserKind };

export async function createSession(userId: string, kind: UserKind) {
  const token = await new SignJWT({ kind })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_S}s`)
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_S,
    path: "/",
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return { sub: payload.sub, kind: payload.kind as UserKind };
  } catch {
    return null;
  }
}

/** Přihlášený uživatel z DB (per-request cache). Blokovaný účet = žádná session. */
export const getSessionUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      kind: true,
      handle: true,
      name: true,
      avatarImageId: true,
      isAdmin: true,
      isBlocked: true,
    },
  });
  if (!user || user.isBlocked) return null;
  return user;
});

/** Vyžaduje přihlášení — pro server actions. Vrací uživatele, jinak vyhazuje. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Nepřihlášený uživatel");
  return user;
}

export const SESSION_COOKIE = COOKIE_NAME;
