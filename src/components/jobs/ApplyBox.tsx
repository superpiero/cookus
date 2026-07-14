"use client";

import { useActionState, useState } from "react";
import { applyToJobAction } from "@/actions/jobs";
import type { FormState } from "@/actions/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea, Label, FieldError, FieldHint } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ApplyBox({
  jobId,
  profile,
}: {
  jobId: string;
  profile: { name: string; headline: string | null; avatarImageId: string | null; verifiedCount: number };
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(applyToJobAction, null);

  if (state?.ok) {
    return (
      <p className="rounded-card border-2 border-teal bg-teal/10 px-4 py-3 text-sm font-semibold text-teal">
        ✓ {state.ok}
      </p>
    );
  }

  return (
    <>
      <Button size="lg" type="button" onClick={() => setOpen(true)}>
        Přihlásit se profilem
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Přihláška profilem">
        <form action={action} className="space-y-4">
          <input type="hidden" name="jobId" value={jobId} />
          <div className="flex items-center gap-3 rounded-card border-2 border-chrome bg-vanilla p-3">
            <Avatar name={profile.name} imageId={profile.avatarImageId} size="md" />
            <div className="min-w-0">
              <div className="truncate font-extrabold">{profile.name}</div>
              {profile.headline && <div className="truncate text-sm text-smoke">{profile.headline}</div>}
            </div>
            {profile.verifiedCount > 0 && (
              <Badge variant="teal" className="ml-auto shrink-0">
                ✓ {profile.verifiedCount}× ověřená praxe
              </Badge>
            )}
          </div>
          <FieldHint>Podnik uvidí celý tvůj profil — fotky, praxi i dovednosti.</FieldHint>
          <div>
            <Label htmlFor="apply-message">Zpráva (volitelná)</Label>
            <Textarea
              id="apply-message"
              name="message"
              maxLength={2000}
              rows={4}
              placeholder="Proč zrovna ty? Kdy můžeš nastoupit?"
            />
          </div>
          <FieldError>{state?.error}</FieldError>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setOpen(false)}>
              Zrušit
            </Button>
            <SubmitButton size="sm">Odeslat přihlášku</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
