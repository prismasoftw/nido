import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SITE_NAME, SUPPORT_EMAIL, SUPPORT_EMAIL_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Aviso de Privacidad — Espazio",
  description:
    "Conoce cómo Espazio recopila, usa y protege tus datos personales de acuerdo con la LFPDPPP.",
  robots: { index: true, follow: true },
};

const LAST_UPDATE = "31 de mayo de 2026";

export default function PrivacidadPage() {
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
            Aviso de Privacidad
          </h1>
          <p className="text-muted-foreground text-sm">
            Última actualización: {LAST_UPDATE}
          </p>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">

          {/* 1 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              1. Identidad y domicilio del Responsable
            </h2>
            <p>
              <strong>Espazio</strong> (en adelante <em>&ldquo;el Responsable&rdquo;</em>),
              con domicilio en Oaxaca de Juárez, Oaxaca, México, es responsable
              del tratamiento de los datos personales que usted nos proporcione,
              de conformidad con lo establecido en la{" "}
              <strong>
                Ley Federal de Protección de Datos Personales en Posesión de los
                Particulares (LFPDPPP)
              </strong>{" "}
              y su Reglamento.
            </p>
            <p>
              Para cualquier consulta relacionada con el tratamiento de sus datos
              puede contactarnos en:{" "}
              <a href={SUPPORT_EMAIL_URL} className="text-primary underline">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </section>

          {/* 2 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              2. Datos personales que recopilamos
            </h2>
            <p>
              Recopilamos los siguientes datos personales cuando usted crea una
              cuenta, utiliza nuestros servicios o se comunica con nosotros:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Identificación:</strong> nombre completo, correo
                electrónico.
              </li>
              <li>
                <strong>De la organización:</strong> nombre del coworking, zona
                horaria, configuraciones de operación.
              </li>
              <li>
                <strong>De pago:</strong> los datos de tarjeta bancaria son
                procesados directamente por{" "}
                <strong>Mercado Pago</strong> a través de sus bricks de pago
                seguros. Espazio nunca almacena números de tarjeta ni CVV.
              </li>
              <li>
                <strong>De uso:</strong> actividad en la plataforma, reservas,
                pagos procesados, miembros registrados.
              </li>
              <li>
                <strong>Técnicos:</strong> dirección IP, tipo de dispositivo y
                navegador, registros de acceso (logs).
              </li>
            </ul>
            <p>
              No recopilamos datos personales sensibles (origen racial, estado
              de salud, creencias religiosas, orientación sexual u otros
              definidos en el Artículo 3, fracción VI de la LFPDPPP).
            </p>
          </section>

          {/* 3 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              3. Finalidades del tratamiento
            </h2>
            <p>
              <strong>Finalidades primarias</strong> (necesarias para la
              prestación del servicio):
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Crear y gestionar su cuenta de usuario.</li>
              <li>
                Proveer el servicio de gestión de coworkings (reservas, pagos,
                miembros, check-in).
              </li>
              <li>
                Procesar cobros de membresías y suscripciones al SaaS mediante
                Mercado Pago.
              </li>
              <li>Enviar notificaciones transaccionales relacionadas con su cuenta.</li>
              <li>Atender solicitudes de soporte técnico.</li>
            </ul>
            <p>
              <strong>Finalidades secundarias</strong> (puede oponerse a éstas):
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Enviar comunicaciones comerciales, novedades y actualizaciones
                del servicio.
              </li>
              <li>
                Realizar análisis estadísticos agregados para mejorar la
                plataforma.
              </li>
            </ul>
            <p>
              Si no desea que sus datos sean tratados para las finalidades
              secundarias, puede manifestarlo enviando un correo a{" "}
              <a href={SUPPORT_EMAIL_URL} className="text-primary underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              con el asunto &ldquo;Oposición finalidades secundarias&rdquo;.
            </p>
          </section>

          {/* 4 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              4. Transferencias de datos
            </h2>
            <p>
              Para prestar el servicio, compartimos sus datos exclusivamente con
              los siguientes terceros encargados del tratamiento:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="border p-2">Tercero</th>
                    <th className="border p-2">Finalidad</th>
                    <th className="border p-2">País</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Mercado Pago", "Procesamiento de pagos y suscripciones", "México / ARG"],
                    ["Supabase Inc.", "Base de datos e infraestructura de backend", "EE. UU."],
                    ["Vercel Inc.", "Hospedaje y entrega de la aplicación web", "EE. UU."],
                    ["Resend Inc.", "Envío de correos transaccionales", "EE. UU."],
                  ].map(([t, f, p]) => (
                    <tr key={t} className="even:bg-muted/40">
                      <td className="border p-2 font-medium">{t}</td>
                      <td className="border p-2">{f}</td>
                      <td className="border p-2">{p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Dichos terceros están obligados a mantener la confidencialidad de
              sus datos y a utilizarlos únicamente para los fines indicados.
              Espazio no vende, renta ni cede datos personales a terceros con
              fines comerciales propios.
            </p>
          </section>

          {/* 5 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              5. Derechos ARCO y revocación del consentimiento
            </h2>
            <p>
              Usted tiene derecho a <strong>Acceder</strong>,{" "}
              <strong>Rectificar</strong>, <strong>Cancelar</strong> y{" "}
              <strong>Oponerse</strong> (derechos ARCO) al tratamiento de sus
              datos personales, así como a revocar el consentimiento que nos
              haya otorgado.
            </p>
            <p>Para ejercer sus derechos, envíe una solicitud a:</p>
            <ul className="list-disc pl-5">
              <li>
                Correo:{" "}
                <a href={SUPPORT_EMAIL_URL} className="text-primary underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                (asunto: &ldquo;Derechos ARCO&rdquo;)
              </li>
            </ul>
            <p>Su solicitud deberá incluir:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Nombre completo y correo registrado en la plataforma.</li>
              <li>Descripción clara del derecho que desea ejercer.</li>
              <li>Cualquier documento que acredite su identidad.</li>
            </ul>
            <p>
              Responderemos en un plazo máximo de <strong>20 días hábiles</strong>.
            </p>
          </section>

          {/* 6 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              6. Cookies y tecnologías de rastreo
            </h2>
            <p>
              Espazio utiliza cookies de sesión estrictamente necesarias para
              mantener la autenticación del usuario y el contexto de la
              organización activa. No utilizamos cookies de rastreo de terceros
              con fines publicitarios. Puede configurar su navegador para
              rechazar cookies, aunque esto puede afectar la funcionalidad del
              servicio.
            </p>
          </section>

          {/* 7 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              7. Seguridad
            </h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger sus
              datos personales contra acceso no autorizado, pérdida, alteración
              o divulgación. Esto incluye cifrado en tránsito (TLS), control de
              acceso basado en roles (RLS en base de datos), y tokens de sesión
              seguros gestionados por Supabase Auth.
            </p>
          </section>

          {/* 8 */}
          <section className="space-y-3">
            <h2 className="font-heading text-base font-semibold">
              8. Cambios a este Aviso de Privacidad
            </h2>
            <p>
              Podemos actualizar este aviso periódicamente. Le notificaremos
              cualquier cambio relevante mediante correo electrónico o a través
              de un aviso visible en la plataforma. La fecha de &ldquo;última
              actualización&rdquo; al inicio del documento siempre reflejará la
              versión vigente.
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
