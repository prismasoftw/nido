"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Clock, X } from "lucide-react";

import { payPlanUpgradeAction } from "@/lib/actions/billing";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CardBrick, type BrickCardData } from "@/components/payments/card-brick";
import type { PlanCode } from "@/lib/supabase/types";

const PLAN_ORDER: PlanCode[] = ["free", "lite", "premium"];

type PlanPrice = { name: string; price_mxn: number };

export function PlanUpgrade({
  currentPlan,
  paid,
  plans,
}: {
  currentPlan: PlanCode;
  /** True when the org already has an active paid subscription. */
  paid: boolean;
  plans: Record<PlanCode, PlanPrice>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<PlanCode | null>(null);
  const [phase, setPhase] = useState<"active" | "pending" | null>(null);

  // When already paid: only offer strictly-higher plans (upgrade).
  // When on trial/expired (not paid): offer the current plan to activate it,
  // plus any higher plans.
  const targets = PLAN_ORDER.filter((p) => {
    const cmp = PLAN_ORDER.indexOf(p) - PLAN_ORDER.indexOf(currentPlan);
    return paid ? cmp > 0 : cmp >= 0;
  });
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
            Ver mi plan
          </Button>
        )}
      </div>
    );
  }

  if (selected) {
    const plan = plans[selected];
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
        const plan = plans[p];
        const isCurrent = p === currentPlan;
        return (
          <Button
            key={p}
            onClick={() => setSelected(p)}
            className="w-full justify-between"
            variant={p === "premium" || isCurrent ? "default" : "outline"}
          >
            <span>
              {isCurrent ? "Activar" : "Mejorar a"} {plan.name} ·{" "}
              {formatMoney(plan.price_mxn)}/mes
            </span>
            <ArrowUpRight className="size-4" />
          </Button>
        );
      })}
    </div>
  );
}
