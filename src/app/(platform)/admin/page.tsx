import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CalendarCheck, DollarSign, Sparkles } from "lucide-react";

import { getPlatformOrgs, getPlatformStats } from "@/lib/platform";
import { PLAN_CATALOG } from "@/lib/plans";
import { formatDate, formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Plataforma — Espazio" };

const PLAN_BADGE: Record<
  "free" | "lite" | "premium",
  "secondary" | "default" | "outline"
> = {
  free: "outline",
  lite: "secondary",
  premium: "default",
};

export default async function PlatformDashboard() {
  const orgs = await getPlatformOrgs();
  const stats = getPlatformStats(orgs);

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
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">
          Panel de plataforma
        </h1>
        <p className="text-muted-foreground text-sm">
          Vista global de todos los coworkings que usan Espazio.
        </p>
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coworking</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Sedes</TableHead>
                <TableHead className="text-right">Espacios</TableHead>
                <TableHead className="text-right">Miembros</TableHead>
                <TableHead className="text-right">Reservas/mes</TableHead>
                <TableHead className="text-right">Alta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link
                      href={`/p/${o.slug}`}
                      className="font-medium hover:underline"
                    >
                      {o.name}
                    </Link>
                    <span className="text-muted-foreground block text-xs">
                      /p/{o.slug}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={PLAN_BADGE[o.plan]}>
                      {PLAN_CATALOG[o.plan].name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {o.locations}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {o.resources}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {o.members}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {o.bookings_this_month}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right text-xs">
                    {formatDate(o.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
