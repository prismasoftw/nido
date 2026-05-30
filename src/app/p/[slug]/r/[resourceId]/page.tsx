import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Users } from "lucide-react";

import {
  DEFAULT_ACCENT,
  getBusyRanges,
  getPortalOrg,
  getPortalResource,
} from "@/lib/portal";
import { RESOURCE_KIND_LABELS } from "@/lib/constants";
import { formatMoney, formatDate, formatTime, minutesToLabel } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PortalBookingForm } from "@/components/portal/portal-booking-form";

type Params = { params: Promise<{ slug: string; resourceId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, resourceId } = await params;
  const org = await getPortalOrg(slug);
  if (!org) return { title: "Coworking no encontrado" };
  const resource = await getPortalResource(org.id, resourceId);
  if (!resource) return { title: `${org.name} — Espacio no encontrado` };
  return {
    title: `${resource.name} — ${org.name}`,
    description: `Reserva ${resource.name} en ${org.name}.`,
  };
}

function priceLabel(r: { price_hour: number | null; price_day: number | null }) {
  if (r.price_hour) return `${formatMoney(r.price_hour)} / hora`;
  if (r.price_day) return `${formatMoney(r.price_day)} / día`;
  return "Consultar tarifa";
}

export default async function PortalResource({ params }: Params) {
  const { slug, resourceId } = await params;
  const org = await getPortalOrg(slug);
  if (!org) notFound();

  const resource = await getPortalResource(org.id, resourceId);
  if (!resource) notFound();

  const accent = org.brand_color || DEFAULT_ACCENT;

  const now = new Date();
  const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const busy = await getBusyRanges(
    resource.id,
    now.toISOString(),
    horizon.toISOString(),
  );

  const today = new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  )
    .toISOString()
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/p/${slug}`}
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver a {org.name}
      </Link>

      <div className="space-y-2">
        <Badge
          variant="secondary"
          className="w-fit"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          {RESOURCE_KIND_LABELS[resource.kind]}
        </Badge>
        <h1 className="font-heading text-3xl font-bold">{resource.name}</h1>
        {resource.description && (
          <p className="text-muted-foreground">{resource.description}</p>
        )}
      </div>

      <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <MapPin className="size-4" />
          {resource.location_name}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-4" />
          {resource.capacity}{" "}
          {resource.capacity === 1 ? "persona" : "personas"}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" />
          Mínimo {minutesToLabel(resource.min_minutes)}
        </span>
        <span className="font-semibold text-foreground">
          {priceLabel(resource)}
        </span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_minmax(0,18rem)]">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-heading mb-4 text-lg font-semibold">
              Reserva tu espacio
            </h2>
            <PortalBookingForm
              slug={slug}
              resourceId={resource.id}
              today={today}
              accent={accent}
            />
          </CardContent>
        </Card>

        <div>
          <h2 className="font-heading mb-3 text-sm font-semibold">
            Horarios ocupados
          </h2>
          {busy.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No hay reservas próximas. ¡Todo disponible!
            </p>
          ) : (
            <ul className="space-y-2">
              {busy.slice(0, 12).map((b, i) => (
                <li
                  key={i}
                  className="bg-muted/40 text-muted-foreground rounded-lg px-3 py-2 text-xs"
                >
                  <span className="text-foreground font-medium">
                    {formatDate(b.starts_at, "EEE d MMM")}
                  </span>{" "}
                  · {formatTime(b.starts_at)} – {formatTime(b.ends_at)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
