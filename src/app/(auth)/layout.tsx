import Link from "next/link";
import { CalendarCheck, CreditCard, QrCode } from "lucide-react";

const appName = "Espazio";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="bg-primary text-primary-foreground relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-[var(--brand)] opacity-30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-white/10 blur-3xl"
        />
        <Link href="/" className="relative flex items-center gap-2 font-semibold">
          <span className="bg-brand text-brand-foreground grid size-8 place-items-center rounded-lg font-heading">
            {appName.charAt(0)}
          </span>
          {appName}
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-heading text-3xl font-semibold leading-tight">
            La forma más simple de operar tu coworking.
          </h2>
          <p className="text-primary-foreground/80 mt-3">
            Reservas, cobros y miembros en un solo lugar.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-center gap-3">
              <span className="bg-white/10 grid size-9 place-items-center rounded-lg">
                <CalendarCheck className="size-4" />
              </span>
              Calendario de reservas en tiempo real
            </li>
            <li className="flex items-center gap-3">
              <span className="bg-white/10 grid size-9 place-items-center rounded-lg">
                <CreditCard className="size-4" />
              </span>
              Cobros con Mercado Pago
            </li>
            <li className="flex items-center gap-3">
              <span className="bg-white/10 grid size-9 place-items-center rounded-lg">
                <QrCode className="size-4" />
              </span>
              Check-in con código QR
            </li>
          </ul>
        </div>

        <p className="text-primary-foreground/60 relative text-xs">
          © {new Date().getFullYear()} {appName}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
