"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type FormState } from "@/actions/auth";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function LoginForm({ next, resetDone }: { next?: string; resetDone?: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, null);
  return (
    <form action={action} className="space-y-4">
      {resetDone && (
        <p className="rounded-card border-2 border-teal bg-teal/10 px-3 py-2 text-sm font-semibold text-teal">
          Heslo změněno. Přihlas se novým heslem.
        </p>
      )}
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="ty@příklad.cz" />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password">Heslo</Label>
          <Link href="/forgot-password" className="text-xs font-semibold text-smoke underline">
            Zapomněl/a jsi heslo?
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <FieldError>{state?.error}</FieldError>
      <SubmitButton className="w-full">Přihlásit se</SubmitButton>
    </form>
  );
}
