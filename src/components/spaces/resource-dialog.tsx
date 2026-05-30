"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import {
  createResourceAction,
  updateResourceAction,
  type FormState,
} from "@/lib/actions/spaces";
import { RESOURCE_KINDS } from "@/lib/constants";
import type { Location, Resource } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function ResourceDialog({
  locations,
  resource,
  defaultLocationId,
  trigger,
}: {
  locations: Pick<Location, "id" | "name">[];
  resource?: Resource;
  defaultLocationId?: string;
  trigger: ReactNode;
}) {
  const editing = Boolean(resource);
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    editing ? updateResourceAction : createResourceAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state?.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form action={action} className="space-y-4">
          {editing && <input type="hidden" name="id" value={resource!.id} />}
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar espacio" : "Nuevo espacio"}
            </DialogTitle>
            <DialogDescription>
              Oficinas, salas, escritorios o lockers reservables.
            </DialogDescription>
          </DialogHeader>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="res-name">Nombre</Label>
              <Input
                id="res-name"
                name="name"
                defaultValue={resource?.name}
                placeholder="Sala Polanco"
                required
              />
              {state?.fieldErrors?.name && (
                <p className="text-destructive text-xs">
                  {state.fieldErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-kind">Tipo</Label>
              <Select name="kind" defaultValue={resource?.kind ?? "meeting_room"}>
                <SelectTrigger id="res-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="res-loc">Sede</Label>
              <Select
                name="location_id"
                defaultValue={resource?.location_id ?? defaultLocationId}
              >
                <SelectTrigger id="res-loc" className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.fieldErrors?.location_id && (
                <p className="text-destructive text-xs">
                  {state.fieldErrors.location_id}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-cap">Capacidad</Label>
              <Input
                id="res-cap"
                name="capacity"
                type="number"
                min={1}
                defaultValue={resource?.capacity ?? 1}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-desc">Descripción</Label>
            <Textarea
              id="res-desc"
              name="description"
              defaultValue={resource?.description ?? ""}
              placeholder="Equipada con pantalla, pizarrón y videollamada."
              rows={2}
            />
          </div>

          <fieldset className="space-y-3 rounded-lg border p-3">
            <legend className="px-1 text-sm font-medium">
              Tarifas (MXN)
            </legend>
            <p className="text-muted-foreground text-xs">
              Define al menos una. Deja en blanco las que no apliquen.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <PriceInput
                name="price_hour"
                label="Por hora"
                value={resource?.price_hour}
              />
              <PriceInput
                name="price_day"
                label="Por día"
                value={resource?.price_day}
              />
              <PriceInput
                name="price_week"
                label="Por semana"
                value={resource?.price_week}
              />
              <PriceInput
                name="price_month"
                label="Por mes"
                value={resource?.price_month}
              />
            </div>
            {state?.fieldErrors?.price_hour && (
              <p className="text-destructive text-xs">
                {state.fieldErrors.price_hour}
              </p>
            )}
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="res-min">Reserva mínima (min)</Label>
              <Input
                id="res-min"
                name="min_minutes"
                type="number"
                min={1}
                defaultValue={resource?.min_minutes ?? 30}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-buffer">Margen entre reservas (min)</Label>
              <Input
                id="res-buffer"
                name="buffer_minutes"
                type="number"
                min={0}
                defaultValue={resource?.buffer_minutes ?? 0}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="res-approval">Requiere aprobación</Label>
              <p className="text-muted-foreground text-xs">
                Las reservas quedan pendientes hasta que las confirmes.
              </p>
            </div>
            <Switch
              id="res-approval"
              name="requires_approval"
              defaultChecked={resource?.requires_approval ?? false}
            />
          </div>

          {editing && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="res-active">Activo</Label>
              <Switch
                id="res-active"
                name="is_active"
                defaultChecked={resource?.is_active ?? true}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Guardar" : "Crear espacio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PriceInput({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value?: number | null;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs font-normal">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type="number"
        min={0}
        defaultValue={value ?? ""}
        placeholder="—"
      />
    </div>
  );
}
