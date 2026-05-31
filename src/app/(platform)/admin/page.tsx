import type { Metadata } from "next";
import Link from "next/link";
import {
  Banknote,
  Building2,
  CalendarCheck,
  DollarSign,
  Rocket,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { getPlatformGrowth, getPlatformOrgs, getPlatformStats } from "@/lib/platform";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GrowthChart } from "@/components/platform/growth-chart";
import { PlanDistribution } from "@/components/platform/plan-distribution";
import { OrgsTable } from "@/components/platform/orgs-table";

export const metadata: Metadata = { title: "Plataforma — Espazio" };

export default async function PlatformDashboard() {
  const orgs = await getPlatformOrgs();
  const stats = getPlatformStats(orgs);
  const growth = getPlatformGrowth(orgs);

  const cards = [
    {
      label: "Coworkings",
      value: String(stats.totalOrgs),
      hint: `+${stats.newOrgsThisMonth} este mes`,
      icon: Building2,
    },
    {
      label: "MRR estimado",
      value: formatMoney(stats.mrr),
      hint: `${stats.byPlan.lite + stats.byPlan.premium} de pago`,
      icon: DollarSign,
    },
    {
      label: "Reservas del mes",
      value: String(stats.bookingsThisMonth),
      hint: "en toda la plataforma",
      icon: CalendarCheck,
    },
    {
      label: "Premium",
      value: String(stats.byPlan.premium),
      hint: `${stats.byPlan.free} free · ${stats.byPlan.lite} lite`,
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">
            Panel de plataforma
          </h1>
          <p className="text-muted-foreground text-sm">
            Vista global de todos los coworkings que usan Espazio.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/payouts">
            <Banknote className="size-4" />
            Retiros y comisiones
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="space-y-3 p-5">
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <c.icon className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{c.label}</p>
                <p className="font-heading text-2xl font-semibold">{c.value}</p>
                <p className="text-muted-foreground text-xs">{c.hint}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {orgs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
              <Rocket className="size-7" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-lg font-semibold">
                Aún no hay coworkings
              </p>
              <p className="text-muted-foreground mx-auto max-w-sm text-sm">
                Cuando el primer negocio se registre en Espazio aparecerá aquí con
                sus métricas, plan y actividad.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/">Ver la página pública</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-primary size-4" />
                  <h2 className="text-sm font-medium">Altas de coworkings</h2>
                  <span className="text-muted-foreground text-xs">
                    · últimos 6 meses
                  </span>
                </div>
                <GrowthChart data={growth} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary size-4" />
                  <h2 className="text-sm font-medium">Distribución por plan</h2>
                </div>
                <PlanDistribution byPlan={stats.byPlan} />
              </CardContent>
            </Card>
          </div>

          <OrgsTable orgs={orgs} />
        </>
      )}
    </div>
  );
}
