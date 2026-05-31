import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SITE_NAME, SITE_URL, SUPPORT_EMAIL, SUPPORT_EMAIL_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Espazio",
  description:
    "Lee los términos y condiciones que rigen el uso de Espazio, el software de gestión de coworkings.",
  robots: { index: true, follow: true },
};

const LAST_UPDATE = "31 de mayo de 2026";

export default function TerminosPage() {
  return (
    <div className="bg-background min-h-svh">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver a {SITE_NAME}
        </Link>

        <header className="mb-10 space-y-2">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">
            Legal
          </p>
          <h1 className="font-heading text-3xl font-bold">
            Términos y Condiciones
          </h1>
          <p className="text-muted-foreground text-sm">
            Última actualización: {LAST_UPDATE}
          </p>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">

          {/* Intro */}
          <p>
            Estos Términos y Condiciones (en adelante <em>&ldquo;los Términos&rdquo;</em>)
            regulan el acceso y uso de la plataforma{" "}
            <strong>Espazio</strong> (
            <a href={SITE_URL} className="text-primary underline">
              {SITE_URL}
            </a>
            ), un software en la nube (SaaS) para la gestión de espacios de
            coworking en México, operado por <strong>Espazio</strong> (en
            adelante <em>&ldquo;Espazio&rdquo;</em>, <em>&ldquo;nosotros&rdquo;</em> o{" "}
            <em>&ldquo;el Proveedor&rdquo;</em>). Al crear una cuenta o usar el servicio,
            usted (<em>&ldquo;el Usuario&rdquo;</em> o <em>&ldquo;el Cliente&rdquo;</em>) acepta estos
            Términos en su totalidad.
          </p>

          {/* 1 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              1. Descripción del servicio
            </h2>
            <p>
              Espazio es una plataforma SaaS que permite a los administradores
              de coworkings gestionar reservas de espacios y salas, cobrar
              membresías y reservas en línea mediante Mercado Pago, administrar
              miembros y roles, controlar accesos con código QR, y visualizar
              métricas de ocupación e ingresos. El servicio se presta bajo
              modalidad de suscripción mensual.
            </p>
          </section>

          {/* 2 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              2. Registro y cuenta
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Para usar Espazio debe crear una cuenta con información veraz,
                completa y actualizada.
              </li>
              <li>
                Usted es responsable de mantener la confidencialidad de sus
                credenciales y de todas las actividades realizadas desde su
                cuenta.
              </li>
              <li>
                Debe notificarnos de inmediato ante cualquier uso no autorizado
                de su cuenta a{" "}
                <a href={SUPPORT_EMAIL_URL} className="text-primary underline">
                  {SUPPORT_EMAIL}
                </a>
                .
              </li>
              <li>
                Espazio se reserva el derecho de suspender o cancelar cuentas
                que incumplan estos Términos o las leyes aplicables.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              3. Período de prueba
            </h2>
            <p>
              Al registrarse, el Cliente obtiene un período de prueba gratuita
              de <strong>14 (catorce) días naturales</strong>, sin necesidad de
              proporcionar datos de tarjeta bancaria. Durante la prueba, el
              Cliente tiene acceso completo a las funciones del plan seleccionado.
            </p>
            <p>
              Al finalizar el período de prueba sin activar una suscripción de
              pago, el acceso al panel de administración quedará suspendido. Los
              datos del Cliente se conservarán durante{" "}
              <strong>30 días adicionales</strong>, tras los cuales podrán ser
              eliminados de forma permanente.
            </p>
          </section>

          {/* 4 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              4. Planes, precios y suscripciones
            </h2>
            <p>Los planes disponibles y sus precios son:</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="border p-2">Plan</th>
                    <th className="border p-2">Precio mensual</th>
                    <th className="border p-2">Comisión por transacción</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Básico", "$199 MXN", "6.0 %"],
                    ["Lite", "$599 MXN", "3.9 %"],
                    ["Premium", "$1,399 MXN", "2.9 %"],
                  ].map(([p, pr, c]) => (
                    <tr key={p} className="even:bg-muted/40">
                      <td className="border p-2 font-medium">{p}</td>
                      <td className="border p-2">{pr}</td>
                      <td className="border p-2">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              La suscripción se renueva automáticamente cada mes mediante cargo
              a la tarjeta bancaria registrada. Los precios están expresados en
              Pesos Mexicanos (MXN) e incluyen el IVA cuando corresponda.
            </p>
            <p>
              Espazio se reserva el derecho de modificar los precios con un
              aviso previo mínimo de <strong>30 días naturales</strong> mediante
              correo electrónico al titular de la cuenta.
            </p>
            <p>
              La comisión por transacción se aplica sobre los pagos procesados
              a través de la plataforma a los miembros del coworking. Dicha
              comisión es adicional a las tarifas propias de Mercado Pago.
            </p>
          </section>

          {/* 5 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              5. Cancelación y reembolsos
            </h2>
            <p>
              El Cliente puede cancelar su suscripción en cualquier momento
              desde la sección de configuración de su cuenta o contactando a
              soporte. La cancelación es efectiva al final del período mensual
              en curso; no se realizan reembolsos por el período ya pagado
              (cobro completo del mes).
            </p>
            <p>
              Espazio podrá cancelar la cuenta del Cliente de forma inmediata
              sin reembolso si se detecta uso fraudulento, violación a estos
              Términos, o incumplimiento de la legislación aplicable.
            </p>
          </section>

          {/* 6 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              6. Procesamiento de pagos
            </h2>
            <p>
              Los pagos de suscripción y las transacciones entre el coworking y
              sus miembros se procesan a través de{" "}
              <strong>Mercado Pago</strong>. Espazio actúa como intermediario
              tecnológico y no almacena información bancaria de los usuarios.
              Los términos de uso y las políticas de Mercado Pago aplican de
              forma independiente.
            </p>
          </section>

          {/* 7 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              7. Uso aceptable
            </h2>
            <p>El Cliente se compromete a no:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Usar el servicio para actividades ilegales, fraudulentas o que
                infrinjan derechos de terceros.
              </li>
              <li>
                Intentar acceder sin autorización a sistemas, datos o cuentas de
                otros usuarios.
              </li>
              <li>
                Realizar ingeniería inversa, descompilar o modificar el software.
              </li>
              <li>
                Revender, sublicenciar o transferir el acceso al servicio a
                terceros sin autorización.
              </li>
              <li>
                Sobrecargar intencionalmente la infraestructura del servicio.
              </li>
            </ul>
          </section>

          {/* 8 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              8. Propiedad intelectual
            </h2>
            <p>
              Todos los derechos de propiedad intelectual sobre el software,
              diseño, marca, logotipos y contenidos de Espazio son propiedad
              exclusiva del Proveedor. El uso del servicio no otorga al Cliente
              ningún derecho de propiedad sobre dichos elementos.
            </p>
            <p>
              El Cliente conserva todos los derechos sobre los datos de su
              organización (nombre del coworking, miembros, reservas, etc.)
              cargados en la plataforma. Espazio solo utiliza dichos datos para
              prestar el servicio conforme al{" "}
              <Link href="/privacidad" className="text-primary underline">
                Aviso de Privacidad
              </Link>
              .
            </p>
          </section>

          {/* 9 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              9. Disponibilidad y nivel de servicio
            </h2>
            <p>
              Espazio procura mantener la plataforma disponible de forma
              continua, pero no garantiza una disponibilidad del 100 %. El
              Proveedor no será responsable por interrupciones causadas por
              mantenimiento programado (notificado con anticipación), fallas en
              servicios de terceros (Supabase, Vercel, Mercado Pago), casos
              fortuitos o de fuerza mayor.
            </p>
          </section>

          {/* 10 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              10. Limitación de responsabilidad
            </h2>
            <p>
              En la máxima medida permitida por la ley, Espazio no será
              responsable por daños indirectos, incidentales, especiales o
              emergentes, incluyendo pérdida de ingresos o datos del Cliente,
              derivados del uso o la imposibilidad de usar el servicio. La
              responsabilidad total del Proveedor ante el Cliente no excederá el
              monto pagado en los últimos <strong>3 meses</strong> de
              suscripción.
            </p>
          </section>

          {/* 11 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              11. Modificaciones a los Términos
            </h2>
            <p>
              Espazio puede modificar estos Términos en cualquier momento.
              Notificaremos los cambios significativos con al menos{" "}
              <strong>15 días naturales</strong> de anticipación por correo
              electrónico. El uso continuado del servicio tras la entrada en
              vigor de los cambios implica la aceptación de los nuevos Términos.
            </p>
          </section>

          {/* 12 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              12. Ley aplicable y jurisdicción
            </h2>
            <p>
              Estos Términos se rigen por las leyes de los{" "}
              <strong>Estados Unidos Mexicanos</strong>. Para cualquier
              controversia derivada de su interpretación o cumplimiento, las
              partes se someten a la jurisdicción de los tribunales competentes
              de la <strong>Ciudad de México</strong>, renunciando a cualquier
              otro fuero que pudiera corresponderles por razón de su domicilio
              presente o futuro.
            </p>
          </section>

          {/* 13 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              13. Contacto
            </h2>
            <p>
              Para cualquier pregunta sobre estos Términos, contáctenos en:{" "}
              <a href={SUPPORT_EMAIL_URL} className="text-primary underline">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </section>

          <p className="text-muted-foreground text-xs border-t pt-6">
            © {new Date().getFullYear()} {SITE_NAME}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
