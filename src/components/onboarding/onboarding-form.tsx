"use client";

import { useActionState, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { createOrganizationAction, type OrgState } from "@/lib/actions/org";
import { formatMoney } from "@/lib/format";
import type { PlanCode } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "America/Mexico_City", label: "Centro (CDMX, Guadalajara, Puebla)" },
  { value: "America/Cancun", label: "Sureste (Cancún, Quintana Roo)" },
  { value: "America/Merida", label: "Mérida (Yucatán)" },
  { value: "America/Monterrey", label: "Monterrey (Nuevo León)" },
  { value: "America/Mazatlan", label: "Pacífico (Mazatlán, Sinaloa)" },
  { value: "America/Chihuahua", label: "Chihuahua" },
  { value: "America/Hermosillo", label: "Hermosillo (Sonora)" },
  { value: "America/Tijuana", label: "Noroeste (Tijuana, BC)" },
];

type PlanOption = {
  code: PlanCode;
  name: string;
  description: string;
  price_mxn: number;
};

export function OnboardingForm({
  plans,
  trialDays,
}: {
  plans: PlanOption[];
  trialDays: number;
}) {
  const [state, formAction, pending] = useActionState<OrgState, FormData>(
    createOrganizationAction,
    null,
  );
  const [plan, setPlan] = useState<PlanCode>(plans[0]?.code ?? "free");

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre del coworking</Label>
        <Input
          id="name"
          name="name"
          autoComplete="organization"
          placeholder="Espazio Coworking Roma Norte"
          required
          autoFocus
        />
        <p className="text-muted-foreground text-xs">
          Así verán tu espacio tus miembros y clientes.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Zona horaria</Label>
        <Select name="timezone" defaultValue="America/Mexico_City">
          <SelectTrigger id="timezone" className="w-full">
            <SelectValue placeholder="Selecciona tu zona horaria" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Las reservas y reportes usarán esta zona horaria.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Elige tu plan</Label>
        <input type="hidden" name="plan" value={plan} />
        <div className="grid gap-2">
          {plans.map((p) => {
            const selected = p.code === plan;
            return (
              <button
                type="button"
                key={p.code}
                onClick={() => setPlan(p.code)}
                aria-pressed={selected}
                className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 ring-primary/30 ring-1"
                    : "hover:border-muted-foreground/30"
                }`}
              >
                <span className="space-y-0.5">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {p.name}
                    {selected && <Check className="text-primary size-4" />}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {p.description}
                  </span>
                </span>
                <span className="shrink-0 text-right text-sm font-semibold">
                  {formatMoney(p.price_mxn)}
                  <span className="text-muted-foreground block text-[10px] font-normal">
                    /mes
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs">
          {trialDays} días gratis. No te cobramos nada hasta que termine la
          prueba, y puedes cambiar de plan cuando quieras.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Empezar prueba gratis
      </Button>
    </form>
  );
}
