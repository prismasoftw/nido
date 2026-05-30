import type { Metadata } from "next";
import { CalendarDays, Plus, User } from "lucide-react";

import { requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BOOKING_STATUS_META } from "@/lib/constants";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { updateBookingStatusAction } from "@/lib/actions/bookings";
import type { BookingStatus } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookingDialog } from "@/components/bookings/booking-dialog";

export const metadata: Metadata = { title: "Reservas" };

type BookingRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  price: number;
  title: string | null;
  guest_name: string | null;
  resources: { name: string } | null;
  locations: { name: string } | null;
  members: { full_name: string } | null;
};

const OPS: Record<BookingStatus, { op: string; label: string }[]> = {
  pending: [
    { op: "confirm", label: "Confirmar" },
    { op: "cancel", label: "Cancelar" },
  ],
  confirmed: [
    { op: "check_in", label: "Check-in" },
    { op: "cancel", label: "Cancelar" },
  ],
  checked_in: [{ op: "complete", label: "Completar" }],
  completed: [],
  cancelled: [],
  no_show: [],
};

function dayKey(iso: string) {
  return formatDate(iso, "EEEE d 'de' MMMM");
}

export default async function BookingsPage() {
  const { org } = await requireOrg();
  const supabase = await createClient();

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const [{ data: bookingsData }, { data: resourcesData }, { data: membersData }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select(
          "id, starts_at, ends_at, status, price, title, guest_name, resources(name), locations(name), members(full_name)",
        )
        .eq("org_id", org.id)
        .gte("ends_at", since.toISOString())
        .order("starts_at", { ascending: true })
        .limit(200),
      supabase
        .from("resources")
        .select("id, name, location_id, locations(name)")
        .eq("org_id", org.id)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("members")
        .select("id, full_name")
        .eq("org_id", org.id)
        .eq("status", "active")
        .order("full_name"),
    ]);

  const bookings = (bookingsData ?? []) as unknown as BookingRow[];
  const resources = (
    (resourcesData ?? []) as unknown as {
      id: string;
      name: string;
      locations: { name: string } | null;
    }[]
  ).map((r) => ({
    id: r.id,
    name: r.name,
    locationName: r.locations?.name ?? "",
  }));
  const members = (
    (membersData ?? []) as unknown as { id: string; full_name: string }[]
  ).map((m) => ({ id: m.id, name: m.full_name }));

  const today = new Date().toISOString().slice(0, 10);

  // Group upcoming/active bookings by day.
  const groups = new Map<string, BookingRow[]>();
  for (const b of bookings) {
    const key = dayKey(b.starts_at);
    const arr = groups.get(key) ?? [];
    arr.push(b);
    groups.set(key, arr);
  }

  const newBookingBtn = (
    <BookingDialog
      resources={resources}
      members={members}
      defaultDate={today}
      trigger={
        <Button size="sm" disabled={resources.length === 0}>
          <Plus className="size-4" />
          Nueva reserva
        </Button>
      }
    />
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Reservas</h1>
          <p className="text-muted-foreground text-sm">
            Agenda de tus espacios. Confirma, registra check-in o cancela.
          </p>
        </div>
        {resources.length > 0 && newBookingBtn}
      </div>

      {resources.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
              <CalendarDays className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Primero crea un espacio</p>
              <p className="text-muted-foreground text-sm">
                Necesitas al menos un espacio activo para registrar reservas.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
              <CalendarDays className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Sin reservas próximas</p>
              <p className="text-muted-foreground text-sm">
                Crea la primera reserva para tu coworking.
              </p>
            </div>
            {newBookingBtn}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([day, rows]) => (
            <section key={day} className="space-y-3">
              <h2 className="font-heading text-sm font-semibold capitalize">
                {day}
              </h2>
              <div className="space-y-2">
                {rows.map((b) => {
                  const meta = BOOKING_STATUS_META[b.status];
                  const who =
                    b.members?.full_name ?? b.guest_name ?? "Invitado";
                  return (
                    <Card key={b.id}>
                      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                        <div className="w-24 shrink-0 font-mono text-sm">
                          {formatTime(b.starts_at)}
                          <span className="text-muted-foreground">
                            {" – "}
                            {formatTime(b.ends_at)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {b.title || b.resources?.name || "Reserva"}
                          </p>
                          <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                            <User className="size-3" />
                            {who}
                            {b.resources?.name && (
                              <span>· {b.resources.name}</span>
                            )}
                            {b.locations?.name && (
                              <span>· {b.locations.name}</span>
                            )}
                          </p>
                        </div>
                        {b.price > 0 && (
                          <span className="text-sm font-medium">
                            {formatMoney(b.price)}
                          </span>
                        )}
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <div className="flex gap-1">
                          {OPS[b.status].map((a) => (
                            <form key={a.op} action={updateBookingStatusAction}>
                              <input type="hidden" name="id" value={b.id} />
                              <input type="hidden" name="op" value={a.op} />
                              <Button
                                type="submit"
                                size="sm"
                                variant={
                                  a.op === "cancel" ? "ghost" : "outline"
                                }
                                className={
                                  a.op === "cancel"
                                    ? "text-muted-foreground hover:text-destructive"
                                    : ""
                                }
                              >
                                {a.label}
                              </Button>
                            </form>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
