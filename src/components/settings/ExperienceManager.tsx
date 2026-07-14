"use client";

import { useActionState, useState, useTransition } from "react";
import { BadgeCheck, Clock, Link2, Trash2, Undo2 } from "lucide-react";
import {
  addExperienceAction,
  deleteExperienceAction,
  linkExperienceAction,
  withdrawExperienceRequestAction,
} from "@/actions/experience";
import type { FormState } from "@/actions/auth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { InstitutionPicker } from "./InstitutionPicker";

export type ExperienceItem = {
  id: string;
  institutionName: string;
  role: string;
  startDate: string; // YYYY-MM
  endDate: string | null;
  description: string | null;
  status: "UNLINKED" | "PENDING" | "CONFIRMED" | "DECLINED";
  report: string | null;
};

function StatusBadge({ status }: { status: ExperienceItem["status"] }) {
  switch (status) {
    case "CONFIRMED":
      return (
        <Badge variant="teal">
          <BadgeCheck className="size-3.5" /> Ověřeno podnikem
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="mustard">
          <Clock className="size-3.5" /> Čeká na potvrzení
        </Badge>
      );
    case "DECLINED":
      return <Badge variant="outline">Odmítnuto</Badge>;
    default:
      return <Badge variant="outline">Neověřeno</Badge>;
  }
}

function LinkForm({ experienceId, onDone }: { experienceId: string; onDone: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(linkExperienceAction, null);
  return (
    <form action={action} className="mt-3 space-y-3 rounded-card border-2 border-dashed border-chrome p-3">
      <input type="hidden" name="experienceId" value={experienceId} />
      <InstitutionPicker label="Propojit s účtem podniku" />
      <FieldError>{state?.error}</FieldError>
      {state?.ok ? (
        <p className="text-sm font-bold text-teal">{state.ok}</p>
      ) : (
        <div className="flex gap-2">
          <SubmitButton size="sm">Požádat o potvrzení</SubmitButton>
          <Button variant="ghost" size="sm" type="button" onClick={onDone}>
            Zavřít
          </Button>
        </div>
      )}
    </form>
  );
}

function ExperienceRow({ item }: { item: ExperienceItem }) {
  const [, startTransition] = useTransition();
  const [linking, setLinking] = useState(false);
  const period = `${item.startDate.replace("-", "/")}–${item.endDate ? item.endDate.replace("-", "/") : "dosud"}`;

  return (
    <li className="rounded-card border-2 border-vinyl bg-porcelain p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-extrabold">
            {item.role} · {item.institutionName}
          </div>
          <div className="text-sm text-smoke">{period}</div>
        </div>
        <StatusBadge status={item.status} />
      </div>
      {item.description && <p className="mt-2 text-sm">{item.description}</p>}
      {item.report && (
        <blockquote className="mt-2 border-l-3 border-teal pl-3 text-sm italic">„{item.report}“</blockquote>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {(item.status === "UNLINKED" || item.status === "DECLINED") && !linking && (
          <Button variant="secondary" size="sm" type="button" onClick={() => setLinking(true)}>
            <Link2 className="size-4" /> Požádat o potvrzení
          </Button>
        )}
        {item.status === "PENDING" && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => startTransition(() => withdrawExperienceRequestAction(item.id))}
          >
            <Undo2 className="size-4" /> Stáhnout žádost
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="text-ketchup"
          onClick={() => {
            if (confirm("Opravdu smazat tenhle záznam praxe?")) {
              startTransition(() => deleteExperienceAction(item.id));
            }
          }}
        >
          <Trash2 className="size-4" /> Smazat
        </Button>
      </div>
      {linking && <LinkForm experienceId={item.id} onDone={() => setLinking(false)} />}
    </li>
  );
}

export function ExperienceManager({ items }: { items: ExperienceItem[] }) {
  const [state, action] = useActionState<FormState, FormData>(addExperienceAction, null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <ExperienceRow key={item.id} item={item} />
          ))}
        </ul>
      )}
      {items.length === 0 && !adding && (
        <p className="text-sm text-smoke">
          Zatím žádná praxe. Přidej, kde jsi vařil/a, obsluhoval/a nebo stážoval/a — a nech si ji potvrdit podnikem.
        </p>
      )}

      {adding ? (
        <form action={action} className="space-y-4 rounded-card border-2 border-vinyl bg-vanilla p-4">
          <InstitutionPicker />
          <div>
            <Label htmlFor="role">Pozice</Label>
            <Input id="role" name="role" required minLength={2} maxLength={80} placeholder="Sous chef" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Od</Label>
              <Input id="startDate" name="startDate" type="month" required />
            </div>
            <div>
              <Label htmlFor="endDate">Do (prázdné = trvá)</Label>
              <Input id="endDate" name="endDate" type="month" />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Popis (volitelný)</Label>
            <Textarea id="description" name="description" maxLength={1000} rows={3} />
          </div>
          <FieldError>{state?.error}</FieldError>
          {state?.ok && <p className="text-sm font-bold text-teal">{state.ok}</p>}
          <div className="flex gap-2">
            <SubmitButton size="sm">Přidat praxi</SubmitButton>
            <Button variant="ghost" size="sm" type="button" onClick={() => setAdding(false)}>
              Zavřít
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" size="sm" type="button" onClick={() => setAdding(true)}>
          + Přidat praxi
        </Button>
      )}
    </div>
  );
}
