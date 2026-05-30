import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">
          Define tu nueva contraseña
        </h1>
        <p className="text-muted-foreground text-sm">
          Ingresa una contraseña nueva para tu cuenta.
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
