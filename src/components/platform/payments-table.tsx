"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { PlatformPayment } from "@/lib/platform";
import { formatMoney, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  approved: { label: "Pagado", variant: "default" },
  pending: { label: "Pendiente", variant: "outline" },
  in_process: { label: "En proceso", variant: "secondary" },
  rejected: { label: "Rechazado", variant: "destructive" },
  refunded: { label: "Reembolsado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const KIND_LABELS: Record<string, string> = {
  booking: "Reserva",
  membership: "Membresía",
  saas_subscription: "Suscripción",
  other: "Otro",
};

export function PaymentsTable({ payments }: { payments: PlatformPayment[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      return (
        p.org_name.toLowerCase().includes(q) ||
        (KIND_LABELS[p.kind] ?? p.kind).toLowerCase().includes(q)
      );
    });
  }, [payments, query, status]);

  const approvedTotal = useMemo(
    () =>
      filtered
        .filter((p) => p.status === "approved")
        .reduce((sum, p) => sum + p.amount, 0),
    [filtered],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-w-xs">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar coworking o tipo…"
              className="pl-9"
              aria-label="Buscar pago"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]" aria-label="Estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="approved">Pagado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in_process">En proceso</SelectItem>
              <SelectItem value="rejected">Rechazado</SelectItem>
              <SelectItem value="refunded">Reembolsado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-muted-foreground text-sm">
          {filtered.length} pagos · Cobrado:{" "}
          <span className="text-foreground font-semibold">
            {formatMoney(approvedTotal)}
          </span>
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Coworking</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  No se encontraron pagos.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const meta = STATUS_META[p.status] ?? {
                  label: p.status,
                  variant: "outline" as const,
                };
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDateTime(p.created_at)}
                    </TableCell>
                    <TableCell className="font-medium">{p.org_name}</TableCell>
                    <TableCell className="text-sm">
                      {KIND_LABELS[p.kind] ?? p.kind}
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(p.amount, p.currency)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
