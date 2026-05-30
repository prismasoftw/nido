import Link from "next/link";
import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">
          Recupera tu contraseña
        </h1>
        <p className="text-muted-foreground text-sm">
          Escribe tu correo y te enviaremos un enlace para restablecerla.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-muted-foreground text-center text-sm">
        <Link href="/login" className="text-primary font-medium hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
