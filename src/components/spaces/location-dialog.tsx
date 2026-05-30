"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import {
  createLocationAction,
  updateLocationAction,
  type FormState,
} from "@/lib/actions/spaces";
import { MX_TIMEZONE_OPTIONS } from "@/lib/timezones";
import type { Location } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LocationDialog({
  location,
  trigger,
}: {
  location?: Location;
  trigger: ReactNode;
}) {
  const editing = Boolean(location);
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    editing ? updateLocationAction : createLocationAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state?.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form action={action} className="space-y-4">
          {editing && <input type="hidden" name="id" value={location!.id} />}
          <DialogHeader>
            <DialogTitle>{editing ? "Editar sede" : "Nueva sede"}</DialogTitle>
            <DialogDescription>
              La ubicación física donde están tus espacios.
            </DialogDescription>
          </DialogHeader>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="loc-name">Nombre</Label>
            <Input
              id="loc-name"
              name="name"
              defaultValue={location?.name}
              placeholder="Sede Roma Norte"
              required
            />
            {state?.fieldErrors?.name && (
              <p className="text-destructive text-xs">{state.fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc-address">Dirección</Label>
            <Input
              id="loc-address"
              name="address"
              defaultValue={location?.address ?? ""}
              placeholder="Av. Álvaro Obregón 123"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="loc-city">Ciudad</Label>
              <Input
                id="loc-city"
                name="city"
                defaultValue={location?.city ?? ""}
                placeholder="CDMX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-tz">Zona horaria</Label>
              <Select
                name="timezone"
                defaultValue={location?.timezone ?? "America/Mexico_City"}
              >
                <SelectTrigger id="loc-tz" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MX_TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {editing && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="loc-active">Activa</Label>
                <p className="text-muted-foreground text-xs">
                  Las sedes inactivas se ocultan del portal público.
                </p>
              </div>
              <Switch
                id="loc-active"
                name="is_active"
                defaultChecked={location?.is_active ?? true}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Guardar" : "Crear sede"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
