import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Users } from "lucide-react";

import {
  DEFAULT_ACCENT,
  getPortalOrg,
  getPortalResources,
} from "@/lib/portal";
import { RESOURCE_KIND_LABELS } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const org = await getPortalOrg(slug);
  if (!org) return { title: "Coworking no encontrado" };
  return {
    title: `${org.name} — Reserva tu espacio`,
    description: `Reserva oficinas, salas y escritorios en ${org.name}.`,
  };
}

function priceLabel(r: { price_hour: number | null; price_day: number | null }) {
  if (r.price_hour) return `${formatMoney(r.price_hour)} / hora`;
  if (r.price_day) return `${formatMoney(r.price_day)} / día`;
  return "Consultar tarifa";
}

export default async function PortalHome({ params }: Params) {
  const { slug } = await params;
  const org = await getPortalOrg(slug);
  if (!org) notFound();

  const resources = await getPortalResources(org.id);
  const accent = org.brand_color || DEFAULT_ACCENT;

  return (
    <div>
      <header
        className="relative overflow-hidden px-4 py-16 text-center"
        style={{
          background: `linear-gradient(160deg, ${accent}22, transparent 70%)`,
        }}
      >
        <div className="mx-auto max-w-3xl space-y-4">
          {org.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logo_url}
              alt={org.name}
              className="mx-auto h-14 w-auto"
            />
          ) : (
            <div
              className="mx-auto flex size-14 items-center justify-center rounded-2xl text-2xl font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              {org.name.charAt(0)}
            </div>
          )}
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            {org.name}
          </h1>
          <p className="text-muted-foreground">
            Elige un espacio y reserva en segundos.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        {resources.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Este coworking aún no tiene espacios disponibles.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <Link key={r.id} href={`/p/${slug}/r/${r.id}`} className="group">
                <Card className="h-full transition-all group-hover:-translate-y-1 group-hover:shadow-lg">
                  <CardContent className="flex h-full flex-col gap-3 p-5">
                    <Badge
                      variant="secondary"
                      className="w-fit"
                      style={{ backgroundColor: `${accent}1a`, color: accent }}
                    >
                      {RESOURCE_KIND_LABELS[r.kind]}
                    </Badge>
                    <div className="space-y-1">
                      <p className="font-heading text-lg font-semibold">
                        {r.name}
                      </p>
                      {r.description && (
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <div className="text-muted-foreground mt-auto flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {r.location_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {r.capacity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{priceLabel(r)}</span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
