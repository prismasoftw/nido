import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, MapPin, User } from "lucide-react";

import { requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BOOKING_STATUS_META } from "@/lib/constants";
import { formatDate, formatTime } from "@/lib/format";
import { checkInBookingAction } from "@/lib/actions/checkin";
import type { BookingStatus } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Check-in" };

type Params = { params: Promise<{ bookingId: string }> };

type BookingRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  title: string | null;
  guest_name: string | null;
  resources: { name: string } | null;
  locations: { name: string } | null;
  members: { full_name: string } | null;
};

export default async function CheckInPage({ params }: Params) {
  const { bookingId } = await params;
  const { org } = await requireOrg();
  const supabase = await createClient();

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, ends_at, status, title, guest_name, resources(name), locations(name), members(full_name)",
    )
    .eq("id", bookingId)
    .eq("org_id", org.id)
    .maybeSingle();

  if (!data) notFound();
  const b = data as unknown as BookingRow;

  const who = b.members?.full_name ?? b.guest_name ?? "Invitado";
  const meta = BOOKING_STATUS_META[b.status];
  const done = b.status === "checked_in" || b.status === "completed";
  const cancelled = b.status === "cancelled" || b.status === "no_show";

  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-lg font-semibold">Check-in</h1>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-base font-medium">
              {b.title || b.resources?.name || "Reserva"}
            </p>
            <p className="text-muted-foreground flex items-center gap-2">
              <User className="size-4" />
              {who}
            </p>
            <p className="text-muted-foreground flex items-center gap-2">
              <CalendarDays className="size-4" />
              {formatDate(b.starts_at, "EEEE d 'de' MMMM")}
            </p>
            <p className="text-muted-foreground flex items-center gap-2">
              <Clock className="size-4" />
              {formatTime(b.starts_at)} – {formatTime(b.ends_at)}
            </p>
            {b.resources?.name && (
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="size-4" />
                {b.resources.name}
                {b.locations?.name && ` · ${b.locations.name}`}
              </p>
            )}
          </div>

          {done ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm">
              <CheckCircle2 className="text-primary size-5" />
              <span className="font-medium">Check-in registrado.</span>
            </div>
          ) : cancelled ? (
            <div className="text-destructive rounded-lg border border-dashed p-4 text-sm">
              Esta reserva está {meta.label.toLowerCase()}; no se puede registrar
              entrada.
            </div>
          ) : (
            <form action={checkInBookingAction}>
              <input type="hidden" name="booking_id" value={b.id} />
              <Button type="submit" className="w-full">
                <CheckCircle2 className="size-4" />
                Confirmar check-in
              </Button>
            </form>
          )}

          <Link
            href="/bookings"
            className="text-muted-foreground hover:text-foreground block text-center text-xs transition-colors"
          >
            Volver a reservas
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
