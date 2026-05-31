import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { DEFAULT_ACCENT, getPortalOrg } from "@/lib/portal";
import { Button } from "@/components/ui/button";

type Params = { params: Promise<{ slug: string }> };
type Search = { searchParams: Promise<{ status?: string }> };

export const metadata: Metadata = {
  title: "Gracias por tu reserva",
  robots: { index: false, follow: false },
};

const VIEWS = {
  approved: {
    Icon: CheckCircle2,
    title: "¡Pago confirmado!",
    body: "Tu reserva quedó confirmada. Te enviamos los detalles por correo.",
  },
  pending: {
    Icon: Clock,
    title: "Pago en proceso",
    body: "Estamos validando tu pago. En cuanto se acredite, tu reserva quedará confirmada y te avisaremos por correo.",
  },
  failure: {
    Icon: XCircle,
    title: "No se completó el pago",
    body: "Tu pago no pudo procesarse. Puedes intentarlo de nuevo desde el espacio que querías reservar.",
  },
} as const;

type StatusKey = keyof typeof VIEWS;

export default async function GraciasPage({
  params,
  searchParams,
}: Params & Search) {
  const { slug } = await params;
  const { status } = await searchParams;
  const org = await getPortalOrg(slug);
  if (!org) notFound();

  const accent = org.brand_color || DEFAULT_ACCENT;
  const key: StatusKey =
    status === "approved" || status === "pending" || status === "failure"
      ? status
      : "pending";
  const view = VIEWS[key];
  const { Icon } = view;
  const tone = key === "failure" ? "#dc2626" : accent;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div
        className="mb-6 flex size-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${tone}1a`, color: tone }}
      >
        <Icon className="size-8" />
      </div>
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">
        {view.title}
      </h1>
      <p className="text-muted-foreground mt-3 text-sm">{view.body}</p>

      <Button
        asChild
        className="mt-8 text-white"
        style={{ backgroundColor: accent }}
      >
        <Link href={`/p/${slug}`}>Volver a {org.name}</Link>
      </Button>
    </div>
  );
}
