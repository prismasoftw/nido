"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import {
  createMembershipPlanAction,
  updateMembershipPlanAction,
  type FormState,
} from "@/lib/actions/memberships";
import { PRICE_UNIT_LABELS } from "@/lib/constants";
import type { MembershipPlan, PriceUnit } from "@/lib/supabase/types";
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

const BILLING_UNITS: PriceUnit[] = ["hour", "day", "week", "month"];

export function MembershipPlanDialog({
  plan,
  trigger,
}: {
  plan?: MembershipPlan;
  trigger: ReactNode;
}) {
  const editing = Boolean(plan);
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    editing ? updateMembershipPlanAction : createMembershipPlanAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state?.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <form action={action} className="space-y-4">
          {editing && <input type="hidden" name="id" value={plan!.id} />}
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar membresía" : "Nueva membresía"}
            </DialogTitle>
            <DialogDescription>
              Planes recurrentes que ofreces a tus clientes.
            </DialogDescription>
          </DialogHeader>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="mp-name">Nombre</Label>
            <Input
              id="mp-name"
              name="name"
              defaultValue={plan?.name}
              placeholder="Hot desk mensual"
              required
            />
            {state?.fieldErrors?.name && (
              <p className="text-destructive text-xs">
                {state.fieldErrors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mp-price">Precio (MXN)</Label>
              <Input
                id="mp-price"
                name="price"
                type="number"
                min={0}
                step={1}
                defaultValue={plan?.price ?? 0}
                required
              />
              {state?.fieldErrors?.price && (
                <p className="text-destructive text-xs">
                  {state.fieldErrors.price}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mp-unit">Periodo</Label>
              <Select
                name="billing_unit"
                defaultValue={plan?.billing_unit ?? "month"}
              >
                <SelectTrigger id="mp-unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      Por {PRICE_UNIT_LABELS[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mp-hours">Horas incluidas por periodo</Label>
            <Input
              id="mp-hours"
              name="included_hours"
              type="number"
              min={0}
              step={1}
              defaultValue={plan?.included_hours ?? ""}
              placeholder="Opcional"
            />
            <p className="text-muted-foreground text-xs">
              Créditos de reserva otorgados al renovar. Déjalo vacío si no aplica.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mp-desc">Descripción</Label>
            <Textarea
              id="mp-desc"
              name="description"
              defaultValue={plan?.description ?? ""}
              rows={2}
              placeholder="Opcional"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="mp-active">Activa</Label>
              <p className="text-muted-foreground text-xs">
                Disponible para asignar a clientes.
              </p>
            </div>
            <Switch
              id="mp-active"
              name="is_active"
              defaultChecked={plan?.is_active ?? true}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Guardar" : "Crear membresía"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
