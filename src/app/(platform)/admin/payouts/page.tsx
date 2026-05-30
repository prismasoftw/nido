import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Banknote, Clock, Wallet } from "lucide-react";

import {
  getPlatformCommission,
  getPlatformPayouts,
  type PlatformPayout,
} from "@/lib/platform";
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
import { PayoutActions } from "@/components/platform/payout-actions";

export const metadata: Metadata = { title: "Retiros — Espazio" };

const STATUS_META: Record<
  PlatformPayout["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  requested: { label: "En revisión", variant: "outline" },
  paid: { label: "Pagado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
};

export default async function PlatformPayouts() {
  const [payouts, commission] = await Promise.all([
    getPlatformPayouts(),
    getPlatformCommission(),
  ]);

  const pending = payouts.filter((p) => p.status === "requested");
  const pendingTotal = pending.reduce((s, p) => s + p.amount, 0);
  const paidTotal = payouts
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);

  const cards = [
    {
      label: "Por pagar",
      value: formatMoney(pendingTotal),
      hint: `${pending.length} solicitud${pending.length === 1 ? "" : "es"}`,
      icon: Clock,
    },
    {
      label: "Pagado histórico",
      value: formatMoney(paidTotal),
      hint: "retiros liquidados",
      icon: Banknote,
    },
    {
      label: "Comisiones ganadas",
      value: formatMoney(commission),
      hint: "de reservas en línea",
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver al panel
        </Link>
        <h1 className="font-heading text-2xl font-semibold">Retiros</h1>
        <p className="text-muted-foreground text-sm">
          Solicitudes de retiro de los coworkings y comisiones de la plataforma.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="bg-foreground/5 text-foreground flex size-11 items-center justify-center rounded-xl">
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

      {payouts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              Aún no hay solicitudes de retiro.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Coworking</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => {
                  const meta = STATUS_META[p.status];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(p.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">{p.org_name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[220px] truncate text-sm">
                        {p.destination ?? "—"}
                        {p.note ? ` · ${p.note}` : ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(p.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === "requested" ? (
                          <PayoutActions payoutId={p.id} />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {p.processed_at ? formatDate(p.processed_at) : "—"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
