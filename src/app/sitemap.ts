import type { MetadataRoute } from "next";

import { createServiceClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  // Public coworking portals — one indexable page per active coworking.
  let portalRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("organizations")
      .select("slug, updated_at, suspended_at")
      .is("suspended_at", null)
      .order("created_at", { ascending: true })
      .limit(5000);

    portalRoutes = ((data ?? []) as { slug: string; updated_at: string }[]).map(
      (o) => ({
        url: `${SITE_URL}/p/${o.slug}`,
        lastModified: o.updated_at ? new Date(o.updated_at) : now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      }),
    );
  } catch {
    // If the DB is unreachable at build time, still ship the static sitemap.
    portalRoutes = [];
  }

  return [...staticRoutes, ...portalRoutes];
}
