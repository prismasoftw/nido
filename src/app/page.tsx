import Link from "next/link";

import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CreditCard,
  QrCode,
  Users,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PricingSection } from "@/components/marketing/pricing-section";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Nido";

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

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg">
              {appName.charAt(0)}
            </span>
            {appName}
          </Link>
          <nav className="text-muted-foreground hidden items-center gap-6 text-sm sm:flex">
            <a href="#features" className="hover:text-foreground">
              Funciones
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Precios
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Empezar gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <span className="text-muted-foreground inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
            Software para espacios de coworking
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Gestiona tu coworking. Cobra, reserva y crece sin caos.
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-pretty text-lg">
            {appName} es la plataforma todo en uno para rentar oficinas, escritorios
            y salas: reservas en tiempo real, pagos con Mercado Pago, miembros y
            métricas. Desde un plan gratis.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Crear cuenta gratis <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#pricing">Ver planes</a>
            </Button>
          </div>
        </section>

        <section id="features" className="bg-muted/30 border-t py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Todo lo que tu coworking necesita
            </h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-center">
              Reemplaza hojas de cálculo y mensajes sueltos por un sistema completo.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="bg-background rounded-xl border p-6 shadow-sm"
                >
                  <div className="bg-primary/10 text-primary grid size-10 place-items-center rounded-lg">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Precios simples y transparentes
            </h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-center">
              Empieza gratis y crece cuando lo necesites. Sin contratos.
            </p>
            <div className="mt-12">
              <PricingSection />
            </div>
          </div>
        </section>

        <section className="bg-primary text-primary-foreground border-t py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Lleva tu coworking al siguiente nivel
            </h2>
            <p className="text-primary-foreground/80 mt-3">
              Crea tu cuenta en minutos y empieza a recibir reservas hoy.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link href="/signup">Empezar gratis</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm sm:flex-row">
          <p>
            © {new Date().getFullYear()} {appName}. Hecho para coworkings en México.
          </p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              Iniciar sesión
            </Link>
            <a href="#pricing" className="hover:text-foreground">
              Precios
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
