"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { signUpAction, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUpAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="full_name">Nombre completo</Label>
        <Input id="full_name" name="full_name" autoComplete="name" placeholder="Ana López" />
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Crear cuenta
      </Button>
    </form>
  );
}
