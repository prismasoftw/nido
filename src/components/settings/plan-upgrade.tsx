"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Clock, X } from "lucide-react";

import { payPlanUpgradeAction } from "@/lib/actions/billing";
import { PLAN_CATALOG } from "@/lib/plans";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CardBrick, type BrickCardData } from "@/components/payments/card-brick";
import type { PlanCode } from "@/lib/supabase/types";

const UPGRADE_TARGETS: PlanCode[] = ["lite", "premium"];

export function PlanUpgrade({ currentPlan }: { currentPlan: PlanCode }) {
  const router = useRouter();
  const [selected, setSelected] = useState<"lite" | "premium" | null>(null);
  const [phase, setPhase] = useState<"active" | "pending" | null>(null);

  // Only show plans strictly above the current one.
  const order: PlanCode[] = ["free", "lite", "premium"];
  const targets = UPGRADE_TARGETS.filter(
    (p) => order.indexOf(p) > order.indexOf(currentPlan),
  );
  if (targets.length === 0) return null;

  if (phase) {
    const isActive = phase === "active";
    const Icon = isActive ? CheckCircle2 : Clock;
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center">
        <Icon className={isActive ? "size-9 text-emerald-600" : "size-9 text-amber-600"} />
        <p className="text-sm font-medium">
          {isActive
            ? "¡Plan activado! Tu suscripción quedó al corriente."
            : "Estamos validando tu pago. Tu plan se activará en cuanto se acredite."}
        </p>
        {isActive && (
          <Button size="sm" onClick={() => router.refresh()}>
            Ver mi nuevo plan
          </Button>
        )}
      </div>
    );
  }

  if (selected) {
    const plan = PLAN_CATALOG[selected];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div>
            <p className="text-sm font-medium">Plan {plan.name}</p>
            <p className="text-muted-foreground text-xs">Suscripción mensual</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-heading text-xl font-semibold">
              {formatMoney(plan.price_mxn)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelected(null)}
              aria-label="Cancelar"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <CardBrick
          amount={plan.price_mxn}
          onPay={async (data: BrickCardData) => {
            const res = await payPlanUpgradeAction({
              plan: selected,
              token: data.token,
            });
            if (res.status === "active" || res.status === "pending") {
              setPhase(res.status);
              return { ok: true };
            }
            return { ok: false, error: res.error };
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {targets.map((p) => {
        const plan = PLAN_CATALOG[p];
        return (
          <Button
            key={p}
            onClick={() => setSelected(p as "lite" | "premium")}
            className="w-full justify-between"
            variant={p === "premium" ? "default" : "outline"}
          >
            <span>
              Mejorar a {plan.name} · {formatMoney(plan.price_mxn)}/mes
            </span>
            <ArrowUpRight className="size-4" />
          </Button>
        );
      })}
    </div>
  );
}
