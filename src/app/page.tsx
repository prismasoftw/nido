import Link from "next/link";

import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CreditCard,
  QrCode,
  Users,
  Building2,
  Sparkles,
  ShieldCheck,
  Clock,
  MessageCircle,
  Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PricingSection } from "@/components/marketing/pricing-section";
import { Reveal } from "@/components/marketing/reveal";
import { StatCounter } from "@/components/marketing/stat-counter";
import { getPlanCatalog } from "@/lib/plans-server";
import { PLAN_ORDER } from "@/lib/plans";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  SUPPORT_WHATSAPP_URL,
  SUPPORT_WHATSAPP_DISPLAY,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_URL,
} from "@/lib/seo";

const appName = "Espazio";

const features = [
  {
    icon: CalendarCheck,
    title: "Reservas en tiempo real",
    desc: "Calendario por hora, día o mes con bloqueo automático de dobles reservas.",
  },
  {
    icon: CreditCard,
    title: "Cobros con Mercado Pago",
    desc: "Acepta pagos en línea y suscripciones recurrentes sin fricción.",
  },
  {
    icon: Users,
    title: "Miembros y membresías",
    desc: "Administra clientes, créditos de horas y planes de membresía.",
  },
  {
    icon: QrCode,
    title: "Check-in con QR",
    desc: "Control de acceso y asistencia desde recepción o autoservicio.",
  },
  {
    icon: BarChart3,
    title: "Analítica de ocupación",
    desc: "Mide ingresos, ocupación y miembros activos en un dashboard.",
  },
  {
    icon: Building2,
    title: "Multi-sede",
    desc: "Gestiona varias ubicaciones y espacios desde una sola cuenta.",
  },
];

const stats = [
  { to: 12000, suffix: "+", label: "Reservas procesadas" },
  { to: 99, suffix: "%", label: "Uptime de la plataforma" },
  { to: 40, suffix: "%", label: "Menos tareas manuales" },
  { to: 3, suffix: " min", label: "Para poner tu sede en línea" },
];

export default async function LandingPage() {
  const catalog = await getPlanCatalog();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/icon"),
        description: SITE_DESCRIPTION,
        areaServed: "MX",
        contactPoint: {
          "@type": "ContactPoint",
          email: "hola@espazio.app",
          contactType: "customer support",
          availableLanguage: ["Spanish"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: "es-MX",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        offers: PLAN_ORDER.map((code) => {
          const plan = catalog[code];
          return {
            "@type": "Offer",
            name: plan.name,
            price: plan.price_mxn,
            priceCurrency: "MXN",
            category: "subscription",
            url: `${SITE_URL}/signup?plan=${code}`,
          };
        }),
      },
    ],
  };

  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="sticky top-0 z-50 px-3 pt-3">
        <div className="glass-strong mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl px-4 shadow-sm">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="from-brand to-primary text-primary-foreground grid size-8 place-items-center rounded-xl bg-gradient-to-br shadow-sm">
              {appName.charAt(0)}
            </span>
            <span className="font-heading">{appName}</span>
          </Link>
          <nav className="text-muted-foreground hidden items-center gap-7 text-sm font-medium sm:flex">
            <a href="#features" className="hover:text-foreground transition-colors">
              Funciones
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Precios
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup" className="group">
                Crear cuenta
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ---------------------------------------------------------------- Hero */}
        <section className="relative overflow-hidden">
          {/* layered glows + grid */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]" />
            <div className="bg-brand/25 animate-aurora absolute -top-24 left-1/4 size-[36rem] rounded-full blur-3xl" />
            <div className="bg-primary/25 animate-aurora absolute -top-10 right-1/4 size-[32rem] rounded-full blur-3xl [animation-delay:3s]" />
          </div>

          <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center sm:pt-28">
            <Reveal>
              <span className="glass text-muted-foreground inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
                <Sparkles className="text-brand size-3.5" />
                Software para espacios de coworking
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="font-heading mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
                Gestiona tu coworking.{" "}
                <span className="text-gradient">Cobra, reserva</span> y crece sin
                caos.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg text-pretty">
                {appName} es la plataforma todo en uno para rentar oficinas,
                escritorios y salas: reservas en tiempo real, pagos con Mercado
                Pago, miembros y métricas. Desde $199 MXN al mes.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" className="group">
                  <Link href="/signup">
                    Crear cuenta
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#pricing">Ver planes</a>
                </Button>
              </div>
              <p className="text-muted-foreground mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="text-brand size-3.5" /> Sin contratos
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="text-brand size-3.5" /> Listo en minutos
                </span>
              </p>
            </Reveal>

            {/* floating app preview */}
            <Reveal delay={320} className="mt-16">
              <div className="animate-float-slow relative mx-auto max-w-4xl">
                <div className="glass-strong overflow-hidden rounded-2xl border shadow-2xl">
                  <AppPreview />
                </div>
                <div className="bg-primary/20 absolute -bottom-8 left-1/2 -z-10 h-24 w-3/4 -translate-x-1/2 rounded-full blur-3xl" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* --------------------------------------------------------------- Stats */}
        <section className="border-y bg-muted/30">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-4 py-12 lg:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 80} className="text-center">
                <div className="font-heading text-gradient text-4xl font-bold">
                  <StatCounter to={s.to} suffix={s.suffix} />
                </div>
                <p className="text-muted-foreground mt-1 text-sm">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------ Features */}
        <section id="features" className="py-24">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Todo lo que tu coworking necesita
              </h2>
              <p className="text-muted-foreground mt-3">
                Reemplaza hojas de cálculo y mensajes sueltos por un sistema
                completo.
              </p>
            </Reveal>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <Reveal key={f.title} delay={(i % 3) * 90}>
                  <div className="group bg-card hover:border-primary/40 relative h-full overflow-hidden rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="from-brand/10 pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="from-brand to-primary text-primary-foreground grid size-11 place-items-center rounded-xl bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <f.icon className="size-5" />
                    </div>
                    <h3 className="font-heading mt-4 font-semibold">{f.title}</h3>
                    <p className="text-muted-foreground mt-1.5 text-sm">
                      {f.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- Pricing */}
        <section id="pricing" className="border-t bg-muted/30 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Precios simples y transparentes
              </h2>
              <p className="text-muted-foreground mt-3">
                Elige tu plan y crece cuando lo necesites. Sin contratos.
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-14">
              <PricingSection />
            </Reveal>
          </div>
        </section>

        {/* ----------------------------------------------------------------- CTA */}
        <section className="px-4 py-20">
          <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border px-6 py-16 text-center">
            <div className="from-primary to-chart-4 absolute inset-0 -z-10 bg-gradient-to-br" />
            <div className="bg-brand/30 absolute -top-16 left-1/3 -z-10 size-72 rounded-full blur-3xl" />
            <h2 className="font-heading text-primary-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Lleva tu coworking al siguiente nivel
            </h2>
            <p className="text-primary-foreground/85 mx-auto mt-3 max-w-xl">
              Crea tu cuenta en minutos y empieza a recibir reservas hoy.
            </p>
            <Button asChild size="lg" variant="secondary" className="group mt-7">
              <Link href="/signup">
                Crear cuenta
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </Reveal>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm sm:flex-row">
          <p>
            © {new Date().getFullYear()} {appName}. Hecho para coworkings en
            México.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="size-4" />
              {SUPPORT_WHATSAPP_DISPLAY}
            </a>
            <a
              href={SUPPORT_EMAIL_URL}
              className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <Mail className="size-4" />
              {SUPPORT_EMAIL}
            </a>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Iniciar sesión
            </Link>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Precios
            </a>
          </div>
        </div>
      </footer>

      {/* Botón flotante de WhatsApp para soporte/ventas. */}
      <a
        href={SUPPORT_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className="fixed bottom-5 right-5 z-50 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        <MessageCircle className="size-7" />
      </a>
    </div>
  );
}

/* Stylized in-product preview (pure markup, no screenshot needed). */
function AppPreview() {
  return (
    <div className="bg-background/60 flex text-left">
      {/* sidebar */}
      <div className="hidden w-44 shrink-0 border-r p-3 sm:block">
        <div className="flex items-center gap-2 px-1 py-2">
          <span className="from-brand to-primary size-5 rounded-md bg-gradient-to-br" />
          <span className="bg-foreground/70 h-2 w-16 rounded" />
        </div>
        <div className="mt-4 space-y-1.5">
          {["Panel", "Reservas", "Espacios", "Miembros", "Pagos"].map((l, i) => (
            <div
              key={l}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                i === 1
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <span
                className={`size-2 rounded-sm ${
                  i === 1 ? "bg-primary" : "bg-muted-foreground/40"
                }`}
              />
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* main */}
      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="bg-foreground/80 h-3 w-32 rounded" />
            <div className="bg-muted-foreground/40 h-2 w-24 rounded" />
          </div>
          <div className="from-brand to-primary h-7 w-20 rounded-lg bg-gradient-to-br" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { k: "Ocupación", v: "78%" },
            { k: "Ingresos", v: "$24.5k" },
            { k: "Miembros", v: "146" },
          ].map((c) => (
            <div key={c.k} className="bg-card rounded-xl border p-3">
              <div className="text-muted-foreground text-[10px]">{c.k}</div>
              <div className="font-heading mt-1 text-sm font-semibold">
                {c.v}
              </div>
            </div>
          ))}
        </div>

        {/* mini calendar grid */}
        <div className="bg-card mt-3 rounded-xl border p-3">
          <div className="mb-2 flex gap-1.5">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div
                key={i}
                className="text-muted-foreground flex-1 text-center text-[9px]"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 21 }).map((_, i) => {
              const busy = [3, 4, 9, 10, 11, 16].includes(i);
              return (
                <div
                  key={i}
                  className={`h-5 rounded ${
                    busy
                      ? "from-brand/70 to-primary/70 bg-gradient-to-br"
                      : "bg-muted"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
