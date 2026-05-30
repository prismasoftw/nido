"use server";

import { revalidatePath } from "next/cache";

import { requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/lib/supabase/types";

export async function checkInBookingAction(formData: FormData): Promise<void> {
  const { org } = await requireOrg();
  const id = String(formData.get("booking_id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, resource_id, member_id")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!booking) return;

  const b = booking as {
    id: string;
    status: BookingStatus;
    resource_id: string;
    member_id: string | null;
  };

  // Idempotent: only advance and log if not already checked in / closed.
  if (b.status === "checked_in" || b.status === "completed") return;

  await supabase
    .from("bookings")
    .update({ status: "checked_in" })
    .eq("id", id)
    .eq("org_id", org.id);

  await supabase.from("check_ins").insert({
    org_id: org.id,
    booking_id: b.id,
    resource_id: b.resource_id,
    member_id: b.member_id,
    method: "qr",
    checked_in_at: new Date().toISOString(),
  });

  revalidatePath(`/checkin/${id}`);
  revalidatePath("/bookings");
}
