"use client";

import { useActionState } from "react";
import { forgotPasswordAction, resetPasswordAction, type FormState } from "@/actions/auth";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ForgotPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(forgotPasswordAction, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">E-mail účtu</Label>
        <Input id="email" name="email" type="email" required placeholder="ty@příklad.cz" />
      </div>
      {state?.ok && (
        <p className="rounded-card border-2 border-teal bg-teal/10 px-3 py-2 text-sm font-semibold text-teal">
          {state.ok}
        </p>
      )}
      <FieldError>{state?.error}</FieldError>
      <SubmitButton className="w-full">Poslat odkaz na obnovu</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetPasswordAction, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="password">Nové heslo</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <FieldError>{state?.error}</FieldError>
      <SubmitButton className="w-full">Nastavit nové heslo</SubmitButton>
    </form>
  );
}
