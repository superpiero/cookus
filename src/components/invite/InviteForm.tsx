"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Check, Copy, X } from "lucide-react";
import { createInviteAction, cancelInviteAction } from "@/actions/invites";
import type { FormState } from "@/actions/auth";
import { Input, Label, Textarea, FieldError, FieldHint } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function InviteForm() {
  const [state, action] = useActionState<FormState, FormData>(createInviteAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div>
        <Label htmlFor="invite-email">E-mail pozvané osoby či podniku</Label>
        <Input id="invite-email" name="email" type="email" required placeholder="kamarad@zkuchyne.cz" />
      </div>
      <div>
        <Label htmlFor="invite-message">Osobní vzkaz (volitelný)</Label>
        <Textarea
          id="invite-message"
          name="message"
          maxLength={500}
          rows={3}
          placeholder="Pojď na Cookus, dělám si tam profil a hledají se lidi jako ty…"
        />
        <FieldHint>Vzkaz se přidá do e-mailu s pozvánkou.</FieldHint>
      </div>
      <FieldError>{state?.error}</FieldError>
      {state?.ok && <p className="text-sm font-bold text-teal">✓ {state.ok}</p>}
      <SubmitButton>Poslat pozvánku</SubmitButton>
    </form>
  );
}

export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard nedostupný — odkaz je vidět v poli */
        }
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-vinyl bg-porcelain px-3 py-1 text-xs font-extrabold hover:bg-chrome-light"
    >
      {copied ? <Check className="size-3.5 text-teal" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Zkopírováno" : "Kopírovat odkaz"}
    </button>
  );
}

export function CancelInviteButton({ invitationId }: { invitationId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Zrušit pozvánku"
      onClick={() => startTransition(() => cancelInviteAction(invitationId))}
      className="rounded-full p-1 text-smoke hover:bg-chrome-light hover:text-ketchup"
    >
      <X className="size-4" aria-hidden />
    </button>
  );
}
