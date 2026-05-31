"use client";

import { useActionState, useEffect } from "react";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  updateOrgSettingsAction,
  type FormState,
} from "@/lib/actions/settings";
import { MX_TIMEZONE_OPTIONS } from "@/lib/timezones";
import type { Organization } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
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

export function OrgSettingsForm({
  org,
  disabled,
  canBrand = true,
}: {
  org: Organization;
  disabled?: boolean;
  canBrand?: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateOrgSettingsAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) toast.success("Configuración guardada.");
  }, [state?.ok]);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="org-name">Nombre del coworking</Label>
        <Input
          id="org-name"
          name="name"
          defaultValue={org.name}
          disabled={disabled}
          required
        />
        {state?.fieldErrors?.name && (
          <p className="text-destructive text-xs">{state.fieldErrors.name}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="org-tz">Zona horaria</Label>
          <Select
            name="timezone"
            defaultValue={org.timezone}
            disabled={disabled}
          >
            <SelectTrigger id="org-tz" className="w-full">
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
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="org-color">Color de marca</Label>
            {!canBrand && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Lock className="size-3" />
                Lite+
              </Badge>
            )}
          </div>
          {canBrand ? (
            <>
              <div className="flex items-center gap-2">
                <Input
                  id="org-color"
                  name="brand_color"
                  type="color"
                  defaultValue={org.brand_color ?? "#f59e0b"}
                  disabled={disabled}
                  className="h-9 w-16 p-1"
                />
                <span className="text-muted-foreground text-sm">
                  Se usa en tu portal público.
                </span>
              </div>
              {state?.fieldErrors?.brand_color && (
                <p className="text-destructive text-xs">
                  {state.fieldErrors.brand_color}
                </p>
              )}
            </>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm">
              <Lock className="size-4 shrink-0" />
              <span>
                Disponible en plan Lite o Premium.{" "}
                <a href="/settings#billing" className="text-primary underline-offset-2 hover:underline">
                  Mejorar plan
                </a>
              </span>
            </div>
          )}
        </div>
      </div>

      {!disabled && (
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Guardar cambios
        </Button>
      )}
    </form>
  );
}
