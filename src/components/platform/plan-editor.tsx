"use client";

import { useActionState, useEffect } from "react";
import { Globe, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import {
  updatePlanAction,
  type PlatformActionState,
} from "@/lib/actions/platform";
import { FEATURE_LABELS, LIMIT_LABELS } from "@/lib/plans";
import type { Plan, PlanFeatures, PlanLimits } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LIMIT_KEYS = Object.keys(LIMIT_LABELS) as (keyof PlanLimits)[];
const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as (keyof PlanFeatures)[];

export function PlanEditor({ plan }: { plan: Plan }) {
  const [state, action, pending] = useActionState<
    PlatformActionState,
    FormData
  >(updatePlanAction, null);

  useEffect(() => {
    if (state?.ok) toast.success(state.message ?? "Plan guardado.");
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="font-heading text-lg capitalize">
              {plan.name}
            </CardTitle>
            <CardDescription>Código: {plan.code}</CardDescription>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              plan.is_public
                ? "bg-emerald-50 text-emerald-700"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {plan.is_public ? (
              <Globe className="size-3" />
            ) : (
              <Lock className="size-3" />
            )}
            {plan.is_public ? "Público" : "Oculto"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          <input type="hidden" name="code" value={plan.code} />

          {/* Basics */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${plan.code}-name`}>Nombre</Label>
              <Input
                id={`${plan.code}-name`}
                name="name"
                defaultValue={plan.name}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${plan.code}-price`}>Precio (MXN/mes)</Label>
              <Input
                id={`${plan.code}-price`}
                name="price_mxn"
                type="number"
                min={0}
                step={1}
                defaultValue={plan.price_mxn}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`${plan.code}-desc`}>Descripción</Label>
              <Textarea
                id={`${plan.code}-desc`}
                name="description"
                rows={2}
                defaultValue={plan.description ?? ""}
                placeholder="Texto que verán los clientes en la página de precios."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${plan.code}-commission`}>
                Comisión por cobro (%)
              </Label>
              <Input
                id={`${plan.code}-commission`}
                name="commission_pct"
                type="number"
                min={0}
                max={100}
                step={0.1}
                defaultValue={plan.commission_bps / 100}
              />
              <p className="text-muted-foreground text-xs">
                Lo que Espazio retiene de cada pago en línea de reservas.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Visible al público</p>
                <p className="text-muted-foreground text-xs">
                  Aparece en la página de precios.
                </p>
              </div>
              {/* Switch posts via a hidden input it controls. */}
              <PublicSwitch defaultChecked={plan.is_public} />
            </div>
          </div>

          {/* Limits */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Límites</h4>
            <p className="text-muted-foreground text-xs">
              Usa <span className="font-mono">-1</span> para ilimitado.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {LIMIT_KEYS.map((key) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={`${plan.code}-limit-${key}`}>
                    {LIMIT_LABELS[key]}
                  </Label>
                  <Input
                    id={`${plan.code}-limit-${key}`}
                    name={`limit_${key}`}
                    type="number"
                    min={-1}
                    step={1}
                    defaultValue={plan.limits[key]}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Funciones</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {FEATURE_KEYS.map((key) => (
                <label
                  key={key}
                  className="hover:bg-accent/40 flex items-center gap-2 rounded-lg border p-2.5 text-sm"
                >
                  <input
                    type="checkbox"
                    name={`feature_${key}`}
                    defaultChecked={plan.features[key]}
                    className="border-input text-primary focus-visible:ring-ring size-4 rounded"
                  />
                  <span>{FEATURE_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar cambios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PublicSwitch({ defaultChecked }: { defaultChecked: boolean }) {
  return (
    <Switch
      name="is_public"
      value="true"
      defaultChecked={defaultChecked}
      aria-label="Visible al público"
    />
  );
}
