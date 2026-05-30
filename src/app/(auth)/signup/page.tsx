import Link from "next/link";
import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Crea tu cuenta</h1>
        <p className="text-muted-foreground text-sm">
          Empieza gratis. Sin tarjeta de crédito.
        </p>
      </div>

      <SignupForm />

      <p className="text-muted-foreground text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
