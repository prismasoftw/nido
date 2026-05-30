"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { updatePasswordAction, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePasswordAction,
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
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar contraseña</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Actualizar contraseña
      </Button>
    </form>
  );
}
