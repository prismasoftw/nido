"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { PlatformMember, PlatformStaff } from "@/lib/platform";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  admin: "Administrador",
  manager: "Gerente",
  reception: "Recepción",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  suspended: "Suspendido",
  invited: "Invitado",
};

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "active") return "default";
  if (status === "invited") return "secondary";
  return "outline";
}

export function UsersTable({
  staff,
  members,
}: {
  staff: PlatformStaff[];
  members: PlatformMember[];
}) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const filteredStaff = useMemo(
    () =>
      staff.filter(
        (s) =>
          !q ||
          s.full_name.toLowerCase().includes(q) ||
          s.org_name.toLowerCase().includes(q),
      ),
    [staff, q],
  );

  const filteredMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          !q ||
          m.full_name.toLowerCase().includes(q) ||
          m.org_name.toLowerCase().includes(q) ||
          (m.email ?? "").toLowerCase().includes(q),
      ),
    [members, q],
  );

  return (
    <Tabs defaultValue="staff" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="staff">Equipo ({staff.length})</TabsTrigger>
          <TabsTrigger value="members">Miembros ({members.length})</TabsTrigger>
        </TabsList>
        <div className="relative max-w-xs">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuario o coworking…"
            className="pl-9"
            aria-label="Buscar usuario"
          />
        </div>
      </div>

      <TabsContent value="staff">
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Coworking</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Alta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    No se encontraron usuarios del equipo.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((s) => (
                  <TableRow key={`${s.org_id}-${s.user_id}`}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell className="text-sm">{s.org_name}</TableCell>
                    <TableCell className="text-sm">
                      {ROLE_LABELS[s.role] ?? s.role}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(s.status)}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right text-xs">
                      {formatDate(s.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="members">
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Coworking</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Alta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    No se encontraron miembros.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {m.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{m.org_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {m.company ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(m.status)}>
                        {STATUS_LABELS[m.status] ?? m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right text-xs">
                      {formatDate(m.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
