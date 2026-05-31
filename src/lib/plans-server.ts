import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_CATALOG, PLAN_ORDER, type PlanInfo } from "@/lib/plans";
import type { PlanCode, PlanFeatures, PlanLimits } from "@/lib/supabase/types";

type PlanRow = {
  code: PlanCode;
  name: string | null;
  description: string | null;
  price_mxn: number | null;
  commission_bps: number | null;
  limits: Partial<PlanLimits> | null;
  features: Partial<PlanFeatures> | null;
};

/**
 * Live plan catalog. Reads the `plans` table and merges each row over the
 * static defaults in PLAN_CATALOG, so platform-admin edits (price, commission,
 * limits, features) take effect across the app. Falls back to the static
 * catalog if the table can't be read.
 */
export async function getPlanCatalog(): Promise<Record<PlanCode, PlanInfo>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("plans")
    .select("code, name, description, price_mxn, commission_bps, limits, features");

  if (error || !data) return PLAN_CATALOG;

  const rows = data as unknown as PlanRow[];
  const byCode = new Map(rows.map((r) => [r.code, r]));

  const result = {} as Record<PlanCode, PlanInfo>;
  for (const code of PLAN_ORDER) {
    const base = PLAN_CATALOG[code];
    const row = byCode.get(code);
    if (!row) {
      result[code] = base;
      continue;
    }
    result[code] = {
      code,
      name: row.name ?? base.name,
      description: row.description ?? base.description,
      price_mxn: row.price_mxn ?? base.price_mxn,
      commission_bps: row.commission_bps ?? base.commission_bps,
      limits: { ...base.limits, ...(row.limits ?? {}) },
      features: { ...base.features, ...(row.features ?? {}) },
    };
  }
  return result;
}
