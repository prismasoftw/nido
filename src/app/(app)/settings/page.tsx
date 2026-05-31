import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, Clock } from "lucide-react";

import { requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FEATURE_LABELS, LIMIT_LABELS, PLAN_ORDER, formatLimit } from "@/lib/plans";
import { getPlanCatalog } from "@/lib/plans-server";
import { getBillingState } from "@/lib/trial";
import { formatMoney } from "@/lib/format";
import type { PlanFeatures, PlanLimits } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrgSettingsForm } from "@/components/settings/org-settings-form";
import { PlanUpgrade } from "@/components/settings/plan-upgrade";

export const metadata: Metadata = { title: "Configuración" };

const USAGE_TO_LIMIT: { usage: string; limit: keyof PlanLimits }[] = [
  { usage: "locations", limit: "locations" },
  { usage: "resources", limit: "resources" },
  { usage: "members", limit: "members" },
  { usage: "staff", limit: "staff" },
  { usage: "bookings_this_month", limit: "bookings_per_month" },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { org, role } = await requireOrg();
  if (role !== "owner" && role !== "admin") redirect("/dashboard");

  const { plan: returnedPlan } = await searchParams;
  // Set when the admin comes back from authorizing a subscription. The plan
  // only flips once Mercado Pago confirms via webhook, so show a pending note.
  const justSubscribed =
    (PLAN_ORDER as string[]).includes(returnedPlan ?? "") &&
    org.plan !== returnedPlan;

  const billing = await getBillingState(org);

  const supabase = await createClient();
  const { data: usageData } = await supabase.rpc("org_usage", { p_org: org.id });
  const usage = (usageData as Record<string, number> | null) ?? {};

  const catalog = await getPlanCatalog();
  const plan = catalog[org.plan];
  const planPrices = Object.fromEntries(
    PLAN_ORDER.map((code) => [
      code,
      { name: catalog[code].name, price_mxn: catalog[code].price_mxn },
    ]),
  ) as Record<(typeof PLAN_ORDER)[number], { name: string; price_mxn: number }>;
  // Show the billing widget when there's something to do: activate (not paid)
  // or upgrade (paid but below premium).
  const showBilling = !billing.paid || org.plan !== "premium";
  const features = Object.entries(plan.features)
    .filter(([, on]) => on)
    .map(([k]) => FEATURE_LABELS[k as keyof PlanFeatures]);

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Configuración</h1>
        <p className="text-muted-foreground text-sm">
          Datos de tu coworking, plan y uso de la plataforma.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Organización</CardTitle>
            <CardDescription>
              Información general de tu coworking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrgSettingsForm org={org} canBrand={catalog[org.plan].features.custom_branding} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Plan {plan.name}</CardTitle>
              <Badge variant={billing.inTrial ? "default" : "secondary"}>
                {billing.inTrial
                  ? `Prueba · ${billing.daysLeft} ${billing.daysLeft === 1 ? "día" : "días"}`
                  : plan.price_mxn === 0
                    ? "Gratis"
                    : `${formatMoney(plan.price_mxn)}/mes`}
              </Badge>
            </div>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              {USAGE_TO_LIMIT.map(({ usage: uk, limit: lk }) => {
                const used = Number(usage[uk] ?? 0);
                const max = plan.limits[lk];
                const pct =
                  max === -1 ? 0 : Math.min(100, (used / Math.max(max, 1)) * 100);
                return (
                  <div key={uk} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {LIMIT_LABELS[lk]}
                      </span>
                      <span className="font-medium">
                        {used} / {formatLimit(max)}
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${max === -1 ? 6 : pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <ul className="space-y-1.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="text-primary size-4 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {justSubscribed && (
              <Alert>
                <Clock className="size-4" />
                <AlertDescription>
                  Estamos confirmando tu suscripción con Mercado Pago. Tu plan se
                  activará en cuanto se acredite el pago.
                </AlertDescription>
              </Alert>
            )}

            {billing.inTrial && (
              <p className="text-muted-foreground text-xs">
                Estás en tu prueba gratis. Activa tu plan para no perder acceso
                cuando termine.
              </p>
            )}

            {showBilling && (
              <PlanUpgrade
                currentPlan={org.plan}
                paid={billing.paid}
                plans={planPrices}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
