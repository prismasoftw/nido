"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

import type { PlatformOrg } from "@/lib/platform";
import { PLAN_CATALOG } from "@/lib/plans";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PLAN_BADGE: Record<
  "free" | "lite" | "premium",
  "secondary" | "default" | "outline"
> = {
  free: "outline",
  lite: "secondary",
  premium: "default",
};

export function OrgsTable({ orgs }: { orgs: PlatformOrg[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q),
    );
  }, [orgs, query]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar coworking…"
          className="pl-9"
          aria-label="Buscar coworking"
        />
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coworking</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Sedes</TableHead>
              <TableHead className="text-right">Espacios</TableHead>
              <TableHead className="text-right">Miembros</TableHead>
              <TableHead className="text-right">Reservas/mes</TableHead>
              <TableHead className="text-right">Alta</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  No se encontraron coworkings.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow
                  key={o.id}
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <TableCell>
                    <Link href={`/admin/orgs/${o.id}`} className="block">
                      <span className="flex items-center gap-2 font-medium">
                        {o.name}
                        {o.suspended_at && (
                          <Badge variant="destructive" className="text-[10px]">
                            Suspendido
                          </Badge>
                        )}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        /p/{o.slug}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={PLAN_BADGE[o.plan]}>
                      {PLAN_CATALOG[o.plan].name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">{o.locations}</TableCell>
                  <TableCell className="text-right text-sm">{o.resources}</TableCell>
                  <TableCell className="text-right text-sm">{o.members}</TableCell>
                  <TableCell className="text-right text-sm">
                    {o.bookings_this_month}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right text-xs">
                    {formatDate(o.created_at)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/orgs/${o.id}`}
                      aria-label={`Ver ${o.name}`}
                      className="text-muted-foreground hover:text-foreground flex justify-end"
                    >
                      <ChevronRight className="size-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
