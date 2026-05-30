import type { Metadata } from "next";
import { CreditCard, Plus, TrendingUp } from "lucide-react";

import { isAdminRole, requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney } from "@/lib/format";
import type { Member, PaymentStatus, PaymentProvider } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentDialog } from "@/components/payments/payment-dialog";

export const metadata: Metadata = { title: "Pagos" };

const STATUS_META: Record<
  PaymentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  approved: { label: "Pagado", variant: "default" },
  pending: { label: "Pendiente", variant: "outline" },
  in_process: { label: "En proceso", variant: "secondary" },
  rejected: { label: "Rechazado", variant: "destructive" },
  refunded: { label: "Reembolsado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  mercadopago: "Mercado Pago",
  cash: "Efectivo",
  transfer: "Transferencia",
  other: "Otro",
};

const KIND_LABELS: Record<string, string> = {
  booking: "Reserva",
  membership: "Membresía",
  saas_subscription: "Suscripción",
  other: "Otro",
};

type PaymentRow = {
  id: string;
  kind: string;
  amount: number;
  status: PaymentStatus;
  provider: PaymentProvider;
  paid_at: string | null;
  created_at: string;
  members: { full_name: string } | null;
};

export default async function PaymentsPage() {
  const { org, role } = await requireOrg();
  const admin = isAdminRole(role);
  const supabase = await createClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: paymentsData }, { data: membersData }] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, kind, amount, status, provider, paid_at, created_at, members(full_name)",
      )
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("members")
      .select("id, full_name")
      .eq("org_id", org.id)
      .order("full_name"),
  ]);

  const payments = (paymentsData ?? []) as unknown as PaymentRow[];
  const members = ((membersData ?? []) as Pick<Member, "id" | "full_name">[]).map(
    (m) => ({ id: m.id, name: m.full_name }),
  );

  const monthRevenue = payments
    .filter(
      (p) =>
        p.status === "approved" &&
        new Date(p.paid_at ?? p.created_at) >= monthStart,
    )
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingTotal = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const addBtn = admin && (
    <PaymentDialog
      members={members}
      trigger={
        <Button size="sm">
          <Plus className="size-4" />
          Registrar pago
        </Button>
      }
    />
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Pagos</h1>
          <p className="text-muted-foreground text-sm">
            Cobros de reservas y membresías. Registra pagos manuales o cobra en
            línea.
          </p>
        </div>
        {addBtn}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Ingresos del mes</p>
              <p className="font-heading text-2xl font-semibold">
                {formatMoney(monthRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-brand/15 text-brand-foreground flex size-11 items-center justify-center rounded-xl">
              <CreditCard className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Pendiente de cobro</p>
              <p className="font-heading text-2xl font-semibold">
                {formatMoney(pendingTotal)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {payments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
              <CreditCard className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Aún no hay pagos</p>
              <p className="text-muted-foreground text-sm">
                Registra tu primer cobro o conecta Mercado Pago.
              </p>
            </div>
            {addBtn}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Medio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const meta = STATUS_META[p.status];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(p.paid_at ?? p.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {p.members?.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {KIND_LABELS[p.kind] ?? p.kind}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {PROVIDER_LABELS[p.provider]}
                      </TableCell>
                      <TableCell>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(p.amount)}
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
