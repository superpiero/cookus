"use client";

import { useActionState } from "react";
import { createJobAction, updateJobAction } from "@/actions/jobs";
import type { FormState } from "@/actions/auth";
import { Input, Label, Select, Textarea, FieldError, FieldHint } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { CITIES, EMPLOYMENT_TYPE_LABELS, JOB_CATEGORY_LABELS } from "@/lib/const";

export type JobFormData = {
  id?: string;
  title?: string;
  category?: string;
  employmentType?: string;
  city?: string;
  address?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryPeriod?: string | null;
  description?: string;
  status?: string;
};

export function JobForm({ job }: { job?: JobFormData }) {
  const isEdit = !!job?.id;
  const [state, action] = useActionState<FormState, FormData>(isEdit ? updateJobAction : createJobAction, null);

  return (
    <form action={action} className="space-y-4">
      {isEdit && <input type="hidden" name="jobId" value={job!.id} />}
      <div>
        <Label htmlFor="title">Název pozice</Label>
        <Input id="title" name="title" required minLength={3} maxLength={90} defaultValue={job?.title ?? ""} placeholder="Šéfkuchař/ka do bistra" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">Kategorie</Label>
          <Select id="category" name="category" defaultValue={job?.category ?? "KUCHAR"}>
            {Object.entries(JOB_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="employmentType">Typ úvazku</Label>
          <Select id="employmentType" name="employmentType" defaultValue={job?.employmentType ?? "PLNY_UVAZEK"}>
            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">Město</Label>
          <Select id="city" name="city" defaultValue={job?.city ?? "Praha"} required>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="address">Adresa / část města (volitelné)</Label>
          <Input id="address" name="address" maxLength={120} defaultValue={job?.address ?? ""} placeholder="Letná, U Průhonu 12" />
        </div>
      </div>
      <fieldset>
        <legend className="mb-1.5 block text-sm font-extrabold uppercase tracking-wide">Mzda (doporučujeme vyplnit)</legend>
        <div className="grid grid-cols-3 gap-3">
          <Input name="salaryMin" type="number" min={0} step={1000} placeholder="od" defaultValue={job?.salaryMin ?? ""} aria-label="Mzda od" />
          <Input name="salaryMax" type="number" min={0} step={1000} placeholder="do" defaultValue={job?.salaryMax ?? ""} aria-label="Mzda do" />
          <Select name="salaryPeriod" defaultValue={job?.salaryPeriod ?? "MESIC"} aria-label="Perioda mzdy">
            <option value="MESIC">Kč/měs</option>
            <option value="HODINA">Kč/hod</option>
          </Select>
        </div>
        <FieldHint>Inzeráty s uvedenou mzdou dostávají výrazně víc přihlášek.</FieldHint>
      </fieldset>
      <div>
        <Label htmlFor="description">Popis pozice</Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={20}
          maxLength={10000}
          rows={8}
          defaultValue={job?.description ?? ""}
          placeholder={"Co budeš vařit, jaký jsme tým, směny, benefity…"}
        />
      </div>
      {isEdit && (
        <div>
          <Label htmlFor="status">Stav inzerátu</Label>
          <Select id="status" name="status" defaultValue={job?.status ?? "OPEN"}>
            <option value="OPEN">Otevřený — přijímá přihlášky</option>
            <option value="CLOSED">Obsazeno — uzavřený</option>
          </Select>
        </div>
      )}
      <FieldError>{state?.error}</FieldError>
      <SubmitButton>{isEdit ? "Uložit změny" : "Vystavit pozici"}</SubmitButton>
    </form>
  );
}
