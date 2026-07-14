import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  AdminDeleteComment,
  AdminDeleteJob,
  AdminDeletePost,
  AdminToggleBlock,
  AdminToggleVerified,
} from "@/components/admin/AdminButtons";

export const metadata: Metadata = { title: "Administrace" };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!user.isAdmin) redirect("/feed");

  const [users, posts, comments, jobs] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        name: true,
        handle: true,
        kind: true,
        verified: true,
        isBlocked: true,
        isAdmin: true,
        avatarImageId: true,
        createdAt: true,
      },
    }),
    db.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, caption: true, createdAt: true, author: { select: { name: true, handle: true } } },
    }),
    db.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, body: true, createdAt: true, author: { select: { name: true } }, postId: true },
    }),
    db.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, title: true, status: true, createdAt: true, institution: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Administrace</h1>

      <section>
        <h2 className="mb-3 font-display text-xl">Účty</h2>
        <ul className="space-y-2">
          {users.map((account) => (
            <Card key={account.id} className="flex flex-wrap items-center gap-3 p-3">
              <Avatar name={account.name} imageId={account.avatarImageId} size="sm" />
              <Link href={`/p/${account.handle}`} className="font-bold underline">
                {account.name}
              </Link>
              <Badge variant="outline">{account.kind === "PERSON" ? "osoba" : "podnik"}</Badge>
              {account.verified && <Badge variant="teal">Ověřený podnik</Badge>}
              {account.isBlocked && <Badge variant="cherry">Blokován</Badge>}
              {account.isAdmin && <Badge variant="mustard">Admin</Badge>}
              <span className="text-xs text-smoke">{timeAgo(account.createdAt)}</span>
              <span className="ml-auto flex gap-1.5">
                {account.kind === "INSTITUTION" && (
                  <AdminToggleVerified userId={account.id} verified={account.verified} />
                )}
                {!account.isAdmin && <AdminToggleBlock userId={account.id} blocked={account.isBlocked} />}
              </span>
            </Card>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">Poslední posty</h2>
        <ul className="space-y-2">
          {posts.map((post) => (
            <Card key={post.id} className="flex items-center gap-3 p-3 text-sm">
              <Link href={`/post/${post.id}`} className="font-bold underline">
                {post.author.name}
              </Link>
              <span className="min-w-0 flex-1 truncate text-smoke">{post.caption ?? "(bez popisku)"}</span>
              <span className="text-xs text-smoke">{timeAgo(post.createdAt)}</span>
              <AdminDeletePost postId={post.id} />
            </Card>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">Poslední komentáře</h2>
        <ul className="space-y-2">
          {comments.map((comment) => (
            <Card key={comment.id} className="flex items-center gap-3 p-3 text-sm">
              <span className="font-bold">{comment.author.name}</span>
              <Link href={`/post/${comment.postId}`} className="min-w-0 flex-1 truncate text-smoke underline">
                {comment.body}
              </Link>
              <span className="text-xs text-smoke">{timeAgo(comment.createdAt)}</span>
              <AdminDeleteComment commentId={comment.id} />
            </Card>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">Poslední inzeráty</h2>
        <ul className="space-y-2">
          {jobs.map((job) => (
            <Card key={job.id} className="flex items-center gap-3 p-3 text-sm">
              <Link href={`/jobs/${job.id}`} className="font-bold underline">
                {job.title}
              </Link>
              <span className="min-w-0 flex-1 truncate text-smoke">{job.institution.name}</span>
              <Badge variant={job.status === "OPEN" ? "mustard" : "outline"}>{job.status}</Badge>
              <AdminDeleteJob jobId={job.id} />
            </Card>
          ))}
        </ul>
      </section>
    </div>
  );
}
