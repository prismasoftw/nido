import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_CATALOG } from "@/lib/plans";
import type { PlanCode } from "@/lib/supabase/types";

export type PlatformOrg = {
  id: string;
  name: string;
  slug: string;
  plan: PlanCode;
  currency: string;
  created_at: string;
  locations: number;
  resources: number;
  members: number;
  bookings_this_month: number;
};

export type PlatformStats = {
  totalOrgs: number;
  byPlan: Record<PlanCode, number>;
  mrr: number;
  bookingsThisMonth: number;
  newOrgsThisMonth: number;
};

function monthStartIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function getPlatformOrgs(): Promise<PlatformOrg[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, name, slug, plan, currency, created_at")
    .order("created_at", { ascending: false });

  const orgs = (data ?? []) as Pick<
    PlatformOrg,
    "id" | "name" | "slug" | "plan" | "currency" | "created_at"
  >[];

  const usages = await Promise.all(
    orgs.map(async (o) => {
      const { data: usage } = await supabase.rpc("org_usage", { p_org: o.id });
      const u = (usage as Record<string, unknown> | null) ?? {};
      return {
        ...o,
        locations: Number(u.locations ?? 0),
        resources: Number(u.resources ?? 0),
        members: Number(u.members ?? 0),
        bookings_this_month: Number(u.bookings_this_month ?? 0),
      } satisfies PlatformOrg;
    }),
  );

  return usages;
}

export type PlatformPayout = {
  id: string;
  org_id: string;
  org_name: string;
  amount: number;
  status: "requested" | "paid" | "rejected";
  destination: string | null;
  note: string | null;
  created_at: string;
  processed_at: string | null;
};

/** All payout requests across orgs, newest first, with the org name resolved. */
export async function getPlatformPayouts(): Promise<PlatformPayout[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("payouts")
    .select(
      "id, org_id, amount, status, destination, note, created_at, processed_at, organizations(name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as (Omit<
    PlatformPayout,
    "org_name"
  > & { organizations: { name: string } | null })[];

  return rows.map((r) => ({
    id: r.id,
    org_id: r.org_id,
    org_name: r.organizations?.name ?? "—",
    amount: r.amount,
    status: r.status,
    destination: r.destination,
    note: r.note,
    created_at: r.created_at,
    processed_at: r.processed_at,
  }));
}

/** Total commission Espazio has earned from approved online booking payments. */
export async function getPlatformCommission(): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("payments")
    .select("amount, metadata")
    .eq("kind", "booking")
    .eq("status", "approved")
    .limit(5000);

  const rows = (data ?? []) as {
    amount: number;
    metadata: Record<string, unknown> | null;
  }[];

  return rows.reduce((sum, p) => {
    const bps = Number(p.metadata?.commission_bps ?? 0);
    return sum + Math.round((p.amount * bps) / 10000);
  }, 0);
}

export function getPlatformStats(orgs: PlatformOrg[]): PlatformStats {
  const byPlan: Record<PlanCode, number> = { free: 0, lite: 0, premium: 0 };
  let mrr = 0;
  let bookingsThisMonth = 0;
  const monthStart = monthStartIso();
  let newOrgsThisMonth = 0;

  for (const o of orgs) {
    byPlan[o.plan] += 1;
    mrr += PLAN_CATALOG[o.plan].price_mxn;
    bookingsThisMonth += o.bookings_this_month;
    if (o.created_at >= monthStart) newOrgsThisMonth += 1;
  }

  return {
    totalOrgs: orgs.length,
    byPlan,
    mrr,
    bookingsThisMonth,
    newOrgsThisMonth,
  };
}
