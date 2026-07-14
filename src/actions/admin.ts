"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) throw new Error("Vyžaduje administrátorská práva");
  return user;
}

export async function adminDeletePostAction(postId: string): Promise<void> {
  await requireAdmin();
  const post = await db.post.findUnique({ where: { id: postId }, select: { imageId: true } });
  if (!post) return;
  await db.$transaction([
    db.post.delete({ where: { id: postId } }),
    db.imageBlob.deleteMany({ where: { id: post.imageId } }),
  ]);
  revalidatePath("/admin");
  revalidatePath("/feed");
}

export async function adminDeleteCommentAction(commentId: string): Promise<void> {
  await requireAdmin();
  await db.comment.deleteMany({ where: { id: commentId } });
  revalidatePath("/admin");
}

export async function adminDeleteJobAction(jobId: string): Promise<void> {
  await requireAdmin();
  await db.job.deleteMany({ where: { id: jobId } });
  revalidatePath("/admin");
  revalidatePath("/jobs");
}

export async function adminToggleBlockAction(userId: string): Promise<void> {
  const admin = await requireAdmin();
  if (userId === admin.id) return;
  const target = await db.user.findUnique({ where: { id: userId }, select: { isBlocked: true, isAdmin: true } });
  if (!target || target.isAdmin) return;
  await db.user.update({ where: { id: userId }, data: { isBlocked: !target.isBlocked } });
  revalidatePath("/admin");
}

export async function adminToggleVerifiedAction(userId: string): Promise<void> {
  await requireAdmin();
  const target = await db.user.findUnique({ where: { id: userId }, select: { verified: true, kind: true } });
  if (!target || target.kind !== "INSTITUTION") return;
  await db.user.update({ where: { id: userId }, data: { verified: !target.verified } });
  revalidatePath("/admin");
}
