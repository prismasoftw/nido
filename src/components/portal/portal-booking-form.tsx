"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import {
  createPortalBookingAction,
  type PortalState,
} from "@/lib/actions/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PortalBookingForm({
  slug,
  resourceId,
  today,
  accent,
}: {
  slug: string;
  resourceId: string;
  today: string;
  accent: string;
}) {
  const [state, action, pending] = useActionState<PortalState, FormData>(
    createPortalBookingAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <CheckCircle2 className="size-10" style={{ color: accent }} />
        <p className="font-medium">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="resource_id" value={resourceId} />

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="p-date">Fecha</Label>
          <Input id="p-date" name="date" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-start">Desde</Label>
          <Input
            id="p-start"
            name="start_time"
            type="time"
            defaultValue="09:00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-end">Hasta</Label>
          <Input
            id="p-end"
            name="end_time"
            type="time"
            defaultValue="10:00"
            required
          />
        </div>
      </div>
      {state?.fieldErrors?.end_time && (
        <p className="text-destructive text-xs">{state.fieldErrors.end_time}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-name">Nombre</Label>
          <Input
            id="p-name"
            name="guest_name"
            placeholder="Tu nombre"
            required
          />
          {state?.fieldErrors?.guest_name && (
            <p className="text-destructive text-xs">
              {state.fieldErrors.guest_name}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-email">Correo</Label>
          <Input
            id="p-email"
            name="guest_email"
            type="email"
            placeholder="tu@correo.com"
            required
          />
          {state?.fieldErrors?.guest_email && (
            <p className="text-destructive text-xs">
              {state.fieldErrors.guest_email}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-phone">Teléfono (opcional)</Label>
        <Input id="p-phone" name="guest_phone" placeholder="55 1234 5678" />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full text-white"
        style={{ backgroundColor: accent }}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Reservar
      </Button>
    </form>
  );
}
