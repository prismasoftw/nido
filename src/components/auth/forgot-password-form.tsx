"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { requestPasswordResetAction, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordResetAction,
    null,
  );

  if (state?.ok) {
    return (
      <Alert>
        <AlertDescription>
          Si tu correo está registrado, te enviamos un enlace para restablecer
          tu contraseña. Revisa tu bandeja de entrada.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@coworking.mx"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Enviar enlace
      </Button>
    </form>
  );
}
