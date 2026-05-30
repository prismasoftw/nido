"use client";

import { useActionState, useEffect } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";

import { startPlanUpgradeAction, type UpgradeState } from "@/lib/actions/billing";
import { PLAN_CATALOG } from "@/lib/plans";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PlanCode } from "@/lib/supabase/types";

const UPGRADE_TARGETS: PlanCode[] = ["lite", "premium"];

export function PlanUpgrade({ currentPlan }: { currentPlan: PlanCode }) {
  const [state, action, pending] = useActionState<UpgradeState, FormData>(
    startPlanUpgradeAction,
    null,
  );

  useEffect(() => {
    if (state?.redirectUrl) window.location.href = state.redirectUrl;
  }, [state?.redirectUrl]);

  // Only show plans strictly above the current one.
  const order: PlanCode[] = ["free", "lite", "premium"];
  const targets = UPGRADE_TARGETS.filter(
    (p) => order.indexOf(p) > order.indexOf(currentPlan),
  );
  if (targets.length === 0) return null;

  return (
    <div className="space-y-3">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {targets.map((p) => {
        const plan = PLAN_CATALOG[p];
        return (
          <form key={p} action={action}>
            <input type="hidden" name="plan" value={p} />
            <Button
              type="submit"
              disabled={pending || Boolean(state?.redirectUrl)}
              className="w-full justify-between"
              variant={p === "premium" ? "default" : "outline"}
            >
              <span>
                Mejorar a {plan.name} · {formatMoney(plan.price_mxn)}/mes
              </span>
              {pending || state?.redirectUrl ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUpRight className="size-4" />
              )}
            </Button>
          </form>
        );
      })}
    </div>
  );
}
