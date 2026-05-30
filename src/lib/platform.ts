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
