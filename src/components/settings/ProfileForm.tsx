"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/actions/profile";
import type { FormState } from "@/actions/auth";
import { Input, Label, Select, Textarea, FieldError, FieldHint } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

type ProfileData = {
  kind: "PERSON" | "INSTITUTION";
  name: string;
  handle: string;
  headline: string | null;
  bio: string | null;
  city: string | null;
  website: string | null;
  openToWork: boolean;
};

export function ProfileForm({ profile, cities }: { profile: ProfileData; cities: readonly string[] }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfileAction, null);
  const isPerson = profile.kind === "PERSON";

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">{isPerson ? "Jméno" : "Název podniku"}</Label>
          <Input id="name" name="name" defaultValue={profile.name} required minLength={2} maxLength={80} />
        </div>
        <div>
          <Label htmlFor="handle">Adresa profilu</Label>
          <Input id="handle" name="handle" defaultValue={profile.handle} required pattern="[a-z0-9-]{3,30}" />
          <FieldHint>cookus.cz/p/tvoje-adresa</FieldHint>
        </div>
      </div>
      <div>
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          name="headline"
          defaultValue={profile.headline ?? ""}
          maxLength={120}
          placeholder={isPerson ? "Šéfkuchař · moderní česká kuchyně" : "Bistro s otevřenou kuchyní na Letné"}
        />
      </div>
      <div>
        <Label htmlFor="city">Město</Label>
        <Select id="city" name="city" defaultValue={profile.city ?? ""}>
          <option value="">— Nevyplněno —</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="bio">{isPerson ? "Krátké resumé" : "O podniku"}</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          maxLength={2000}
          rows={5}
          placeholder={
            isPerson
              ? "Kdo jsi, co umíš, kde jsi vařil/a, co hledáš…"
              : "Co vaříte, jaký jste tým, co u vás lidi čeká…"
          }
        />
      </div>
      {!isPerson && (
        <div>
          <Label htmlFor="website">Web</Label>
          <Input id="website" name="website" type="url" defaultValue={profile.website ?? ""} placeholder="https://…" />
        </div>
      )}
      {isPerson && (
        <label className="flex cursor-pointer items-center gap-3 rounded-card border-2 border-vinyl bg-vanilla px-4 py-3">
          <input
            type="checkbox"
            name="openToWork"
            defaultChecked={profile.openToWork}
            className="size-5 accent-cherry"
          />
          <span>
            <span className="block font-extrabold">Hledám práci</span>
            <span className="text-sm text-smoke">Zobrazí se na profilu a v adresáři lidí.</span>
          </span>
        </label>
      )}
      <FieldError>{state?.error}</FieldError>
      {state?.ok && <p className="text-sm font-bold text-teal">{state.ok}</p>}
      <SubmitButton>Uložit profil</SubmitButton>
    </form>
  );
}
