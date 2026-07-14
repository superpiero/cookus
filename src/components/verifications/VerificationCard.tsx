"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import { confirmExperienceAction, declineExperienceAction } from "@/actions/experience";
import type { FormState } from "@/actions/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label, Textarea, FieldError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export type VerificationItem = {
  id: string;
  role: string;
  period: string;
  description: string | null;
  person: { name: string; handle: string; avatarImageId: string | null };
};

export function VerificationCard({ item }: { item: VerificationItem }) {
  const [state, action] = useActionState<FormState, FormData>(confirmExperienceAction, null);
  const [, startTransition] = useTransition();

  if (state?.ok) {
    return (
      <Card className="border-teal p-4">
        <p className="text-sm font-bold text-teal">✓ Praxe potvrzena. Díky — reference dělají Cookus důvěryhodný.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar name={item.person.name} imageId={item.person.avatarImageId} size="lg" />
        <div className="min-w-0 flex-1">
          <Link href={`/p/${item.person.handle}`} className="font-extrabold underline">
            {item.person.name}
          </Link>
          <p className="text-sm">
            uvádí praxi: <b>{item.role}</b> · {item.period}
          </p>
          {item.description && <p className="mt-1 text-sm text-smoke">{item.description}</p>}
        </div>
      </div>
      <form action={action} className="mt-3 space-y-3 border-t-2 border-chrome pt-3">
        <input type="hidden" name="experienceId" value={item.id} />
        <div>
          <Label htmlFor={`report-${item.id}`}>Report / reference (volitelné, zobrazí se na profilu)</Label>
          <Textarea
            id={`report-${item.id}`}
            name="report"
            maxLength={1000}
            rows={3}
            placeholder="Jak se u vás osvědčil/a? Pár vět, které mají váhu."
          />
        </div>
        <FieldError>{state?.error}</FieldError>
        <div className="flex gap-2">
          <SubmitButton size="sm">Potvrdit praxi</SubmitButton>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="text-ketchup"
            onClick={() => {
              if (confirm("Opravdu odmítnout? Uchazeč dostane notifikaci.")) {
                startTransition(() => declineExperienceAction(item.id));
              }
            }}
          >
            Odmítnout
          </Button>
        </div>
      </form>
    </Card>
  );
}
