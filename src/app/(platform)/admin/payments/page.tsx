import type { Metadata } from "next";

import { getPlatformPayments } from "@/lib/platform";
import { PaymentsTable } from "@/components/platform/payments-table";

export const metadata: Metadata = { title: "Pagos · Plataforma" };

export default async function PlatformPaymentsPage() {
  const payments = await getPlatformPayments();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Pagos globales</h1>
        <p className="text-muted-foreground text-sm">
          Todos los cobros de reservas, membresías y suscripciones de cada
          coworking.
        </p>
      </div>

      <PaymentsTable payments={payments} />
    </div>
  );
}
