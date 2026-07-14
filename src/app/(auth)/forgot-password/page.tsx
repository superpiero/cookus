import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { ForgotPasswordForm } from "@/components/auth/PasswordForms";

export const metadata: Metadata = { title: "Zapomenuté heslo" };

export default function ForgotPasswordPage() {
  return (
    <Card className="p-6">
      <h1 className="font-display mb-1 text-2xl">Zapomenuté heslo</h1>
      <p className="mb-4 text-sm text-smoke">Pošleme ti e-mailem odkaz na obnovu.</p>
      <ForgotPasswordForm />
    </Card>
  );
}
