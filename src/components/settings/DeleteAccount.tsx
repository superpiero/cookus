"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction, type FormState } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(deleteAccountAction, null);

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" type="button" className="text-ketchup" onClick={() => setConfirming(true)}>
        Smazat účet…
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-card border-2 border-ketchup bg-porcelain p-4">
      <p className="text-sm font-semibold">
        Smazání účtu je nevratné. Zmizí profil, fotky, praxe, inzeráty, přihlášky i konverzace.
      </p>
      <div>
        <Label htmlFor="delete-password">Potvrď heslem</Label>
        <Input id="delete-password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <FieldError>{state?.error}</FieldError>
      <div className="flex gap-2">
        <SubmitButton variant="danger" size="sm">
          Nenávratně smazat účet
        </SubmitButton>
        <Button variant="ghost" size="sm" type="button" onClick={() => setConfirming(false)}>
          Zrušit
        </Button>
      </div>
    </form>
  );
}
