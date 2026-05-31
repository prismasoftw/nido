"use client";

import { useActionState, useEffect, useState } from "react";
import { Ban, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  changeOrgPlanAction,
  setOrgSuspendedAction,
  type PlatformActionState,
} from "@/lib/actions/platform";
import { PLAN_CATALOG, PLAN_ORDER } from "@/lib/plans";
import type { PlanCode } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function OrgAdminActions({
  orgId,
  currentPlan,
  suspended,
}: {
  orgId: string;
  currentPlan: PlanCode;
  suspended: boolean;
}) {
  const [plan, setPlan] = useState<PlanCode>(currentPlan);

  const [planState, planAction, planPending] = useActionState<
    PlatformActionState,
    FormData
  >(changeOrgPlanAction, null);
  const [suspState, suspAction, suspPending] = useActionState<
    PlatformActionState,
    FormData
  >(setOrgSuspendedAction, null);

  useEffect(() => {
    if (planState?.ok) toast.success(planState.message ?? "Plan actualizado.");
    if (planState?.error) toast.error(planState.error);
  }, [planState]);

  useEffect(() => {
    if (suspState?.ok) toast.success(suspState.message ?? "Estado actualizado.");
    if (suspState?.error) toast.error(suspState.error);
  }, [suspState]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Change plan */}
      <form action={planAction} className="flex items-center gap-2">
        <input type="hidden" name="org_id" value={orgId} />
        <input type="hidden" name="plan" value={plan} />
        <Select value={plan} onValueChange={(v) => setPlan(v as PlanCode)}>
          <SelectTrigger className="w-[150px]" aria-label="Plan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAN_ORDER.map((code) => (
              <SelectItem key={code} value={code}>
                {PLAN_CATALOG[code].name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={planPending || plan === currentPlan}>
          {planPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Cambiar plan
        </Button>
      </form>

      {/* Suspend / reactivate */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant={suspended ? "outline" : "destructive"}
            disabled={suspPending}
          >
            {suspended ? (
              <RefreshCw className="size-4" />
            ) : (
              <Ban className="size-4" />
            )}
            {suspended ? "Reactivar" : "Suspender"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {suspended ? "¿Reactivar coworking?" : "¿Suspender coworking?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {suspended
                ? "El equipo del coworking volverá a tener acceso a su panel."
                : "El equipo del coworking no podrá acceder a su panel hasta que lo reactives. Su portal público seguirá visible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <form action={suspAction}>
              <input type="hidden" name="org_id" value={orgId} />
              <input
                type="hidden"
                name="suspend"
                value={suspended ? "false" : "true"}
              />
              <AlertDialogAction type="submit">
                {suspended ? "Reactivar" : "Suspender"}
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
