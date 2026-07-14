"use client";

import { useActionState, useState } from "react";
import { ChefHat, Store } from "lucide-react";
import { registerAction, type FormState } from "@/actions/auth";
import { Input, Label, Select, FieldError, FieldHint } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

const CATEGORIES: [string, string][] = [
  ["RESTAURACE", "Restaurace"],
  ["KAVARNA", "Kavárna"],
  ["BAR", "Bar"],
  ["HOTEL", "Hotel"],
  ["BISTRO", "Bistro"],
  ["CATERING", "Catering"],
  ["CUKRARNA", "Cukrárna"],
  ["PIVOVAR", "Pivovar"],
  ["SKOLA", "Škola / kurzy"],
  ["JINE", "Jiné"],
];

export function RegisterForm({
  initialKind,
  inviteId,
}: {
  initialKind: "PERSON" | "INSTITUTION";
  inviteId?: string;
}) {
  const [kind, setKind] = useState<"PERSON" | "INSTITUTION">(initialKind);
  const [state, action] = useActionState<FormState, FormData>(registerAction, null);

  const optionClass = (active: boolean) =>
    `flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-card border-2 px-3 py-3 text-sm font-extrabold ${
      active ? "border-vinyl bg-cherry text-white shadow-diner-sm" : "border-chrome bg-porcelain text-vinyl"
    }`;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      {inviteId && <input type="hidden" name="invite" value={inviteId} />}
      <div className="flex gap-3" role="radiogroup" aria-label="Druh účtu">
        <button type="button" role="radio" aria-checked={kind === "PERSON"} className={optionClass(kind === "PERSON")} onClick={() => setKind("PERSON")}>
          <ChefHat className="size-6" aria-hidden />
          Jsem člověk z gastra
        </button>
        <button type="button" role="radio" aria-checked={kind === "INSTITUTION"} className={optionClass(kind === "INSTITUTION")} onClick={() => setKind("INSTITUTION")}>
          <Store className="size-6" aria-hidden />
          Jsme podnik
        </button>
      </div>

      <div>
        <Label htmlFor="name">{kind === "PERSON" ? "Jméno a příjmení" : "Název podniku"}</Label>
        <Input id="name" name="name" required minLength={2} maxLength={80} placeholder={kind === "PERSON" ? "Karel Dvořák" : "Bistro U Chroma"} />
      </div>

      {kind === "INSTITUTION" && (
        <div>
          <Label htmlFor="category">Typ podniku</Label>
          <Select id="category" name="category" defaultValue="RESTAURACE">
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="ty@příklad.cz" />
      </div>
      <div>
        <Label htmlFor="password">Heslo</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <FieldHint>Aspoň 8 znaků.</FieldHint>
      </div>

      <FieldError>{state?.error}</FieldError>
      <SubmitButton className="w-full">
        {kind === "PERSON" ? "Vytvořit profil" : "Vytvořit profil podniku"}
      </SubmitButton>
    </form>
  );
}
