import Link from "next/link";
import { Check, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import {
  FEATURE_LABELS,
  LIMIT_LABELS,
  PLAN_CATALOG,
  PLAN_ORDER,
  formatLimit,
} from "@/lib/plans";
import type { PlanFeatures, PlanLimits } from "@/lib/supabase/types";

const HIGHLIGHT = "lite";

export function PricingSection() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      {PLAN_ORDER.map((code) => {
        const plan = PLAN_CATALOG[code];
        const highlighted = code === HIGHLIGHT;
        return (
          <div
            key={code}
            className={cn(
              "bg-background relative flex flex-col rounded-2xl border p-6 shadow-sm",
              highlighted && "border-primary ring-primary/20 shadow-md ring-2",
            )}
          >
            {highlighted && (
              <span className="bg-primary text-primary-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium">
                Más popular
              </span>
            )}
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="text-muted-foreground mt-1 min-h-10 text-sm">
              {plan.description}
            </p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold">
                {plan.price_mxn === 0 ? "$0" : formatMoney(plan.price_mxn)}
              </span>
              <span className="text-muted-foreground text-sm">/mes</span>
            </div>

            <Button
              asChild
              className="mt-6"
              variant={highlighted ? "default" : "outline"}
            >
              <Link href={`/signup?plan=${code}`}>
                {code === "free" ? "Empezar gratis" : "Elegir plan"}
              </Link>
            </Button>

            <ul className="mt-6 space-y-2 text-sm">
              {(Object.keys(LIMIT_LABELS) as (keyof PlanLimits)[]).map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <Check className="text-primary size-4 shrink-0" />
                  <span>
                    {LIMIT_LABELS[key]}:{" "}
                    <span className="font-medium">
                      {formatLimit(plan.limits[key])}
                    </span>
                  </span>
                </li>
              ))}
              {(Object.keys(FEATURE_LABELS) as (keyof PlanFeatures)[]).map((key) => {
                const on = plan.features[key];
                return (
                  <li
                    key={key}
                    className={cn(
                      "flex items-center gap-2",
                      !on && "text-muted-foreground",
                    )}
                  >
                    {on ? (
                      <Check className="text-primary size-4 shrink-0" />
                    ) : (
                      <Minus className="size-4 shrink-0 opacity-50" />
                    )}
                    <span>{FEATURE_LABELS[key]}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
