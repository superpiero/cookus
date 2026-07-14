"use client";

import { useActionState, useTransition } from "react";
import { X } from "lucide-react";
import { addSkillAction, removeSkillAction } from "@/actions/profile";
import type { FormState } from "@/actions/auth";
import { Input, FieldError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function SkillsManager({ skills }: { skills: { id: string; name: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(addSkillAction, null);
  const [, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {skills.length === 0 && <p className="text-sm text-smoke">Zatím žádné dovednosti — přidej první.</p>}
        {skills.map((skill) => (
          <span
            key={skill.id}
            className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-vinyl bg-porcelain px-3 py-1 text-sm font-extrabold"
          >
            {skill.name}
            <button
              type="button"
              aria-label={`Odebrat ${skill.name}`}
              className="rounded-full p-0.5 hover:bg-chrome-light"
              onClick={() => startTransition(() => removeSkillAction(skill.id))}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
      <form
        action={(formData) => {
          action(formData);
        }}
        className="flex items-start gap-2"
      >
        <div className="flex-1">
          <Input name="name" placeholder="např. Moderní česká kuchyně" maxLength={40} required minLength={2} />
          <FieldError>{state?.error}</FieldError>
        </div>
        <SubmitButton variant="secondary" size="md">
          Přidat
        </SubmitButton>
      </form>
    </div>
  );
}
