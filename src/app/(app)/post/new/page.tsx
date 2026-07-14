import type { Metadata } from "next";
import { PostComposer } from "@/components/posts/PostComposer";

export const metadata: Metadata = { title: "Nová fotka" };

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display mb-1 text-3xl">Přidat fotku</h1>
      <p className="mb-5 text-sm text-smoke">Jídlo, drink, plac, tým — ukaž, jak u vás gastro žije.</p>
      <PostComposer />
    </div>
  );
}
