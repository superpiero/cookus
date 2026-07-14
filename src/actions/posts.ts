"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify, removeUnreadLikeNotification } from "@/lib/notify";
import { MAX_POSTS_PER_USER } from "@/lib/const";
import type { FormState } from "./auth";

const postSchema = z.object({
  imageId: z.string().min(1, "Nejdřív nahraj fotku"),
  caption: z.string().trim().max(2200, "Popisek max 2200 znaků").optional(),
  aspect: z.enum(["SQUARE", "PORTRAIT"]),
});

export async function createPostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };

  const image = await db.imageBlob.findUnique({
    where: { id: parsed.data.imageId },
    select: { ownerId: true },
  });
  if (!image || image.ownerId !== user.id) return { error: "Obrázek nenalezen." };

  const count = await db.post.count({ where: { authorId: user.id } });
  if (count >= MAX_POSTS_PER_USER) return { error: `Maximum je ${MAX_POSTS_PER_USER} fotek na účet.` };

  const post = await db.post.create({
    data: {
      authorId: user.id,
      imageId: parsed.data.imageId,
      caption: parsed.data.caption || null,
      aspect: parsed.data.aspect,
    },
    select: { id: true },
  });

  revalidatePath("/feed");
  revalidatePath(`/p/${user.handle}`);
  redirect(`/post/${post.id}`);
}

export async function deletePostAction(postId: string): Promise<void> {
  const user = await requireUser();
  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true, imageId: true } });
  if (!post) return;
  if (post.authorId !== user.id && !user.isAdmin) return;

  await db.$transaction([
    db.post.delete({ where: { id: postId } }),
    db.imageBlob.deleteMany({ where: { id: post.imageId } }),
  ]);
  revalidatePath("/feed");
  revalidatePath(`/p/${user.handle}`);
  redirect(user.isAdmin && post.authorId !== user.id ? "/admin" : `/p/${user.handle}`);
}

/** Idempotentní like/unlike. Vrací nový stav. */
export async function toggleLikeAction(postId: string): Promise<{ liked: boolean; count: number } | { error: string }> {
  const user = await requireUser();
  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) return { error: "Post nenalezen." };

  const existing = await db.like.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
    select: { id: true },
  });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    await removeUnreadLikeNotification(postId, user.id);
  } else {
    await db.like.upsert({
      where: { postId_userId: { postId, userId: user.id } },
      create: { postId, userId: user.id },
      update: {},
    });
    await notify({ userId: post.authorId, actorId: user.id, type: "LIKE", postId });
  }

  const count = await db.like.count({ where: { postId } });
  revalidatePath(`/post/${postId}`);
  revalidatePath("/feed");
  return { liked: !existing, count };
}

const commentSchema = z.object({
  postId: z.string().min(1),
  body: z.string().trim().min(1, "Komentář nesmí být prázdný").max(1000, "Komentář max 1000 znaků"),
});

export async function addCommentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };

  const post = await db.post.findUnique({ where: { id: parsed.data.postId }, select: { authorId: true } });
  if (!post) return { error: "Post už neexistuje." };

  await db.comment.create({
    data: { postId: parsed.data.postId, authorId: user.id, body: parsed.data.body },
  });
  await notify({ userId: post.authorId, actorId: user.id, type: "COMMENT", postId: parsed.data.postId });

  revalidatePath(`/post/${parsed.data.postId}`);
  revalidatePath("/feed");
  return null;
}

export async function deleteCommentAction(commentId: string): Promise<void> {
  const user = await requireUser();
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, postId: true, post: { select: { authorId: true } } },
  });
  if (!comment) return;
  // mazat smí autor komentáře, autor postu i admin
  if (comment.authorId !== user.id && comment.post.authorId !== user.id && !user.isAdmin) return;
  await db.comment.delete({ where: { id: commentId } });
  revalidatePath(`/post/${comment.postId}`);
}
