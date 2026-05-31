import type { Metadata } from "next";

import { getPlatformPlans } from "@/lib/platform";
import { PlanEditor } from "@/components/platform/plan-editor";

export const metadata: Metadata = { title: "Planes · Plataforma" };

export default async function PlatformPlansPage() {
  const plans = await getPlatformPlans();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Planes y precios</h1>
        <p className="text-muted-foreground text-sm">
          Edita precios, comisiones, límites y funciones. Los cambios aplican al
          instante en la página de precios, el alta y el cobro a nuevos
          coworkings.
        </p>
      </div>

      <div className="space-y-6">
        {plans.map((plan) => (
          <PlanEditor key={plan.code} plan={plan} />
        ))}
      </div>
    </div>
  );
}
