"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { createOrganizationAction, type OrgState } from "@/lib/actions/org";
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

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<OrgState, FormData>(
    createOrganizationAction,
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
        <Label htmlFor="name">Nombre del coworking</Label>
        <Input
          id="name"
          name="name"
          autoComplete="organization"
          placeholder="Nido Coworking Roma Norte"
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

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Crear mi espacio
      </Button>
    </form>
  );
}
