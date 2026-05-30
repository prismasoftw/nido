import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { ResourceKind } from "@/lib/supabase/types";

export type PortalOrg = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
};

export type PortalResource = {
  id: string;
  name: string;
  kind: ResourceKind;
  description: string | null;
  capacity: number;
  price_hour: number | null;
  price_day: number | null;
  min_minutes: number;
  location_name: string;
};

export const DEFAULT_ACCENT = "#f59e0b";

export async function getPortalOrg(slug: string): Promise<PortalOrg | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, name, slug, logo_url, brand_color")
    .eq("slug", slug)
    .maybeSingle();
  return (data as PortalOrg | null) ?? null;
}

export async function getPortalResources(
  orgId: string,
): Promise<PortalResource[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("resources")
    .select(
      "id, name, kind, description, capacity, price_hour, price_day, min_minutes, is_active, locations(name, is_active)",
    )
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name");

  const rows = (data ?? []) as unknown as (Omit<
    PortalResource,
    "location_name"
  > & { locations: { name: string; is_active: boolean } | null })[];

  return rows
    .filter((r) => r.locations?.is_active)
    .map((r) => ({
      id: r.id,
      name: r.name,
      kind: r.kind,
      description: r.description,
      capacity: r.capacity,
      price_hour: r.price_hour,
      price_day: r.price_day,
      min_minutes: r.min_minutes,
      location_name: r.locations?.name ?? "",
    }));
}

export async function getPortalResource(
  orgId: string,
  resourceId: string,
): Promise<PortalResource | null> {
  const all = await getPortalResources(orgId);
  return all.find((r) => r.id === resourceId) ?? null;
}

export async function getBusyRanges(
  resourceId: string,
  fromIso: string,
  toIso: string,
): Promise<{ starts_at: string; ends_at: string }[]> {
  const supabase = createServiceClient();
  const { data } = await supabase.rpc("resource_busy_ranges", {
    p_resource: resourceId,
    p_from: fromIso,
    p_to: toIso,
  });
  return (data as { starts_at: string; ends_at: string }[] | null) ?? [];
}
