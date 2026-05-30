import type { Metadata } from "next";

import { requireOrg } from "@/lib/auth";
import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = { title: "Pagos" };

export default async function PaymentsPage() {
  await requireOrg();
  return (
    <ComingSoon
      title="Pagos"
      description="Cobros, facturas y conciliación con Mercado Pago."
    />
  );
}
