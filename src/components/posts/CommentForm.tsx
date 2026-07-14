"use client";

import { useActionState, useRef, useEffect } from "react";
import { addCommentAction } from "@/actions/posts";
import type { FormState } from "@/actions/auth";
import { Input, FieldError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function CommentForm({ postId }: { postId: string }) {
  const [state, action] = useActionState<FormState, FormData>(addCommentAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex items-start gap-2">
      <input type="hidden" name="postId" value={postId} />
      <div className="flex-1">
        <Input name="body" placeholder="Přidat komentář…" maxLength={1000} required aria-label="Komentář" />
        <FieldError>{state?.error}</FieldError>
      </div>
      <SubmitButton variant="secondary" size="md">
        Odeslat
      </SubmitButton>
    </form>
  );
}
