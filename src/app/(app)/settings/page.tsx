import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireOrg } from "@/lib/auth";
import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const { role } = await requireOrg();
  if (role !== "owner" && role !== "admin") redirect("/dashboard");

  return (
    <ComingSoon
      title="Configuración"
      description="Datos del espacio, equipo, plan y facturación."
    />
  );
}
