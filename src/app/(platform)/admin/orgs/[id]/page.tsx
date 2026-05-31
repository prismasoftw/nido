import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  DoorOpen,
  ExternalLink,
  MapPin,
  Users,
  Wallet,
} from "lucide-react";

import { getPlatformOrgDetail } from "@/lib/platform";
import { PLAN_CATALOG } from "@/lib/plans";
import { BOOKING_STATUS_META } from "@/lib/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import type { BookingStatus, PaymentStatus } from "@/lib/supabase/types";
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
import { OrgAdminActions } from "@/components/platform/org-admin-actions";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const org = await getPlatformOrgDetail(id);
  return { title: org ? `${org.name} — Plataforma` : "Coworking — Plataforma" };
}

const PLAN_BADGE: Record<"free" | "lite" | "premium", "secondary" | "default" | "outline"> = {
  free: "outline",
  lite: "secondary",
  premium: "default",
};

const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  approved: { label: "Aprobado", variant: "default" },
  pending: { label: "Pendiente", variant: "outline" },
  in_process: { label: "En proceso", variant: "secondary" },
  rejected: { label: "Rechazado", variant: "destructive" },
  refunded: { label: "Reembolsado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const SUB_STATUS_LABEL: Record<string, string> = {
  trialing: "En prueba",
  active: "Activa",
  past_due: "Vencida",
  cancelled: "Cancelada",
  paused: "Pausada",
};

export default async function OrgDetailPage({ params }: Params) {
  const { id } = await params;
  const org = await getPlatformOrgDetail(id);
  if (!org) notFound();

  const cards = [
    { label: "Sedes", value: String(org.usage.locations), icon: Building2 },
    { label: "Espacios", value: String(org.usage.resources), icon: DoorOpen },
    { label: "Miembros", value: String(org.usage.members), icon: Users },
    {
      label: "Reservas/mes",
      value: String(org.usage.bookings_this_month),
      icon: CalendarCheck,
    },
    {
      label: "Saldo billetera",
      value: formatMoney(org.walletBalance, org.currency),
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver al panel
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="text-primary-foreground flex size-12 items-center justify-center rounded-xl font-heading text-lg font-semibold"
            style={{ background: org.brand_color ?? "#4f46e5" }}
          >
            {org.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold">{org.name}</h1>
              <Badge variant={PLAN_BADGE[org.plan]}>{PLAN_CATALOG[org.plan].name}</Badge>
              {org.suspended_at && <Badge variant="destructive">Suspendido</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">
              Alta {formatDate(org.created_at)} ·{" "}
              <Link
                href={`/p/${org.slug}`}
                className="hover:text-foreground inline-flex items-center gap-1"
              >
                /p/{org.slug}
                <ExternalLink className="size-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Admin actions */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium">Acciones de plataforma</p>
            <p className="text-muted-foreground text-xs">
              Cambia el plan manualmente o suspende el acceso del coworking.
            </p>
          </div>
          <OrgAdminActions
            orgId={org.id}
            currentPlan={org.plan}
            suspended={Boolean(org.suspended_at)}
          />
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="space-y-2 p-4">
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                <c.icon className="size-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{c.label}</p>
                <p className="font-heading text-xl font-semibold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscription */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="text-sm font-medium">Suscripción</h2>
            {org.subscription ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Estado</dt>
                  <dd className="font-medium">
                    {SUB_STATUS_LABEL[org.subscription.status] ?? org.subscription.status}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Plan</dt>
                  <dd className="font-medium">
                    {PLAN_CATALOG[org.subscription.plan_code].name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Renueva</dt>
                  <dd className="font-medium">
                    {org.subscription.current_period_end
                      ? formatDate(org.subscription.current_period_end)
                      : "—"}
                  </dd>
                </div>
                {org.subscription.cancel_at_period_end && (
                  <p className="text-amber-600 text-xs">
                    Programada para cancelarse al final del periodo.
                  </p>
                )}
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">
                Sin suscripción de pago (plan {PLAN_CATALOG[org.plan].name}).
              </p>
            )}
          </CardContent>
        </Card>

        {/* Locations */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="text-sm font-medium">Sedes</h2>
            {org.locations.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aún no registra sedes.</p>
            ) : (
              <ul className="space-y-2">
                {org.locations.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 text-sm">
                    <MapPin className="text-muted-foreground size-4 shrink-0" />
                    <span className="font-medium">{l.name}</span>
                    {l.city && (
                      <span className="text-muted-foreground">· {l.city}</span>
                    )}
                    {!l.is_active && (
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        Inactiva
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-sm font-medium">Reservas recientes</h2>
          {org.recentBookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin reservas todavía.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Espacio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {org.recentBookings.map((b) => {
                  const meta = BOOKING_STATUS_META[b.status as BookingStatus];
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(b.starts_at)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {b.resource_name}
                      </TableCell>
                      <TableCell className="text-sm">{b.guest}</TableCell>
                      <TableCell>
                        <Badge variant={meta?.variant ?? "outline"}>
                          {meta?.label ?? b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatMoney(b.price, org.currency)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent payments */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-sm font-medium">Pagos recientes</h2>
          {org.recentPayments.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin pagos todavía.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {org.recentPayments.map((p) => {
                  const meta = PAYMENT_STATUS_META[p.status as PaymentStatus];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(p.created_at)}
                      </TableCell>
                      <TableCell className="text-sm capitalize">{p.kind}</TableCell>
                      <TableCell>
                        <Badge variant={meta?.variant ?? "outline"}>
                          {meta?.label ?? p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatMoney(p.amount, org.currency)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
