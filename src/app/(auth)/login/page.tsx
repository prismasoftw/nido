import Link from "next/link";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; checkEmail?: string }>;
}) {
  const { redirectTo, checkEmail } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Bienvenido de nuevo</h1>
        <p className="text-muted-foreground text-sm">
          Inicia sesión para administrar tu coworking.
        </p>
      </div>

      {checkEmail && (
        <Alert>
          <AlertDescription>
            Te enviamos un correo para confirmar tu cuenta. Revísalo y luego inicia
            sesión.
          </AlertDescription>
        </Alert>
      )}

      <LoginForm redirectTo={redirectTo} />

      <p className="text-muted-foreground text-center text-sm">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
