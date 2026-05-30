import type { Metadata } from "next";

import { requireOrg } from "@/lib/auth";
import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = { title: "Miembros" };

export default async function MembersPage() {
  await requireOrg();
  return (
    <ComingSoon
      title="Miembros"
      description="Tus clientes, sus planes y el equipo de tu coworking."
    />
  );
}
