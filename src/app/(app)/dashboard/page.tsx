import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  LayoutGrid,
  Users,
  ArrowUpRight,
} from "lucide-react";

import { requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatLimit } from "@/lib/plans";
import { getPlanCatalog } from "@/lib/plans-server";
import type { PlanLimits } from "@/lib/supabase/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Panel" };

type Stat = {
  key: keyof PlanLimits;
  label: string;
  value: number;
  icon: typeof Building2;
  href: string;
};

export default async function DashboardPage() {
  const { org, role } = await requireOrg();
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();

  const [locations, resources, members, bookings] = await Promise.all([
    supabase
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id),
    supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id),
    supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id)
      .gte("starts_at", monthStart),
  ]);

  const plan = (await getPlanCatalog())[org.plan];

  const stats: Stat[] = [
    {
      key: "locations",
      label: "Sedes",
      value: locations.count ?? 0,
      icon: Building2,
      href: "/spaces",
    },
    {
      key: "resources",
      label: "Espacios",
      value: resources.count ?? 0,
      icon: LayoutGrid,
      href: "/spaces",
    },
    {
      key: "members",
      label: "Miembros",
      value: members.count ?? 0,
      icon: Users,
      href: "/members",
    },
    {
      key: "bookings_per_month",
      label: "Reservas este mes",
      value: bookings.count ?? 0,
      icon: CalendarDays,
      href: "/bookings",
    },
  ];

  const isEmpty =
    (resources.count ?? 0) === 0 && (members.count ?? 0) === 0;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">
            Hola de nuevo 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            Resumen de {org.name} · Plan{" "}
            <span className="capitalize">{org.plan}</span>
          </p>
        </div>
        {(role === "owner" || role === "admin") && (
          <Button asChild variant="outline" size="sm">
            <Link href="/settings">
              Mejorar plan
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const limit = plan.limits[stat.key];
          return (
            <Link key={stat.key} href={stat.href} className="group">
              <Card className="transition-shadow group-hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <stat.icon className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold tabular-nums">
                      {stat.value}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      / {formatLimit(limit)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {isEmpty ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Configura tu espacio
            </CardTitle>
            <CardDescription>
              Sigue estos pasos para empezar a recibir reservas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <SetupStep
              n={1}
              title="Crea una sede"
              desc="Agrega la ubicación de tu coworking."
              href="/spaces"
            />
            <SetupStep
              n={2}
              title="Agrega espacios"
              desc="Oficinas, salas y escritorios reservables."
              href="/spaces"
            />
            <SetupStep
              n={3}
              title="Invita miembros"
              desc="Registra a tus clientes y equipo."
              href="/members"
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Actividad reciente
            </CardTitle>
            <CardDescription>
              Las próximas reservas aparecerán aquí.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Aún no hay reservas próximas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SetupStep({
  n,
  title,
  desc,
  href,
}: {
  n: number;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="hover:border-primary/40 hover:bg-accent/40 flex flex-col gap-1 rounded-lg border p-4 transition-colors"
    >
      <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full text-sm font-semibold">
        {n}
      </span>
      <span className="mt-1 text-sm font-medium">{title}</span>
      <span className="text-muted-foreground text-xs">{desc}</span>
    </Link>
  );
}
