import { type NextRequest } from "next/server";
import QRCode from "qrcode";

import { requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlanCatalog } from "@/lib/plans-server";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await ctx.params;

  // Gate: qr_checkin is a paid-tier feature.
  const { org } = await requireOrg();
  const catalog = await getPlanCatalog();
  if (!catalog[org.plan].features.qr_checkin) {
    return new Response("Tu plan no incluye check-in QR.", { status: 403 });
  }

  // RLS scopes this select to bookings of orgs where the user is staff.
  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("id", bookingId)
    .eq("org_id", org.id)
    .maybeSingle();

  if (!booking) {
    return new Response("No encontrado", { status: 404 });
  }

  const { origin } = new URL(request.url);
  const checkinUrl = `${origin}/checkin/${bookingId}`;
  const png = await QRCode.toBuffer(checkinUrl, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=300",
    },
  });
}
