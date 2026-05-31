import type { Metadata } from "next";

import { getPlatformMembers, getPlatformStaff } from "@/lib/platform";
import { UsersTable } from "@/components/platform/users-table";

export const metadata: Metadata = { title: "Usuarios · Plataforma" };

export default async function PlatformUsersPage() {
  const [staff, members] = await Promise.all([
    getPlatformStaff(),
    getPlatformMembers(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">
          Usuarios globales
        </h1>
        <p className="text-muted-foreground text-sm">
          Equipos que operan cada coworking y los miembros (clientes) que
          atienden.
        </p>
      </div>

      <UsersTable staff={staff} members={members} />
    </div>
  );
}
