import type { Metadata } from "next";

import { requireOrg } from "@/lib/auth";
import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = { title: "Reservas" };

export default async function BookingsPage() {
  await requireOrg();
  return (
    <ComingSoon
      title="Reservas"
      description="Calendario y gestión de reservas de tus espacios."
    />
  );
}
