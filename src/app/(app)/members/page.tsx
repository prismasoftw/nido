import type { Metadata } from "next";
import { Mail, Pencil, Plus, UserPlus, Users, X } from "lucide-react";

import { isAdminRole, requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { revokeInvitationAction } from "@/lib/actions/team";
import type { Member, MemberRole, MemberStatus } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberDialog } from "@/components/members/member-dialog";
import { InviteDialog } from "@/components/members/invite-dialog";
import { StaffRowActions } from "@/components/members/staff-row-actions";

export const metadata: Metadata = { title: "Miembros" };

const STATUS_META: Record<
  MemberStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Activo", variant: "default" },
  inactive: { label: "Inactivo", variant: "secondary" },
  suspended: { label: "Suspendido", variant: "destructive" },
  invited: { label: "Invitado", variant: "outline" },
};

export default async function MembersPage() {
  const { org, role } = await requireOrg();
  const admin = isAdminRole(role);
  const supabase = await createClient();

  const [{ data: membersData }, { data: staffData }, { data: invitesData }] =
    await Promise.all([
      supabase
        .from("members")
        .select("*")
        .eq("org_id", org.id)
        .order("full_name"),
      supabase
        .from("organization_members")
        .select("user_id, role, status")
        .eq("org_id", org.id),
      supabase
        .from("invitations")
        .select("id, email, role, expires_at")
        .eq("org_id", org.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

  const members = (membersData ?? []) as Member[];
  const staff = (staffData ?? []) as {
    user_id: string;
    role: MemberRole;
    status: MemberStatus;
  }[];
  const invites = (invitesData ?? []) as {
    id: string;
    email: string;
    role: MemberRole;
    expires_at: string;
  }[];

  // Resolve staff display names from profiles (no direct FK to embed).
  const ids = staff.map((s) => s.user_id);
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);
    for (const p of (profiles ?? []) as { id: string; full_name: string | null }[]) {
      names.set(p.id, p.full_name ?? "Sin nombre");
    }
  }

  const roleRank: Record<MemberRole, number> = {
    owner: 0,
    admin: 1,
    manager: 2,
    reception: 3,
  };
  staff.sort((a, b) => roleRank[a.role] - roleRank[b.role]);

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Miembros</h1>
        <p className="text-muted-foreground text-sm">
          Tus clientes y el equipo que opera el coworking.
        </p>
      </div>

      <Tabs defaultValue="clients" className="gap-4">
        <TabsList>
          <TabsTrigger value="clients">
            <Users className="size-4" />
            Clientes ({members.length})
          </TabsTrigger>
          <TabsTrigger value="team">
            <UserPlus className="size-4" />
            Equipo ({staff.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <div className="flex justify-end">
            <MemberDialog
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  Nuevo miembro
                </Button>
              }
            />
          </div>
          {members.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
                  <Users className="size-6" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Aún no tienes clientes registrados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => {
                      const meta = STATUS_META[m.status];
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">
                            {m.full_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {m.email || m.phone || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {m.company || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <MemberDialog
                              member={m}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          {admin && (
            <div className="flex justify-end">
              <InviteDialog
                trigger={
                  <Button size="sm">
                    <Mail className="size-4" />
                    Invitar
                  </Button>
                }
              />
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Persona</TableHead>
                    <TableHead className="text-right">Rol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((s) => (
                    <TableRow key={s.user_id}>
                      <TableCell className="font-medium">
                        {names.get(s.user_id) ?? "Sin nombre"}
                      </TableCell>
                      <TableCell className="flex justify-end">
                        {admin ? (
                          <StaffRowActions userId={s.user_id} role={s.role} />
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {ROLE_LABELS[s.role]}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {admin && invites.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground text-sm font-medium">
                Invitaciones pendientes
              </h3>
              {invites.map((inv) => (
                <Card key={inv.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <Mail className="text-muted-foreground size-4" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{inv.email}</p>
                      <p className="text-muted-foreground text-xs">
                        {ROLE_LABELS[inv.role]} · expira{" "}
                        {formatDate(inv.expires_at)}
                      </p>
                    </div>
                    <form action={revokeInvitationAction}>
                      <input type="hidden" name="id" value={inv.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive size-8"
                      >
                        <X className="size-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
