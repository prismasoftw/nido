/** Central SEO configuration shared across metadata, sitemap, robots and JSON-LD. */

/** Canonical production URL. Override with NEXT_PUBLIC_SITE_URL if it differs. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://espazio.app"
).replace(/\/$/, "");

export const SITE_NAME = "Espazio";

export const SITE_TAGLINE = "Software para coworkings";

export const SITE_DESCRIPTION =
  "Espazio es la plataforma todo en uno para administrar tu coworking en México: reservas en tiempo real, pagos con Mercado Pago, miembros, check-in con QR y métricas. Desde $199 MXN al mes.";

/** Brand color used for theme-color and OG backgrounds. */
export const BRAND_COLOR = "#4f46e5";

export const SITE_KEYWORDS = [
  "software para coworking",
  "gestión de coworking",
  "sistema de reservas coworking",
  "administrar espacios de trabajo",
  "reservas de oficinas",
  "renta de salas de juntas",
  "coworking México",
  "software espacios compartidos",
  "control de accesos coworking",
  "pagos Mercado Pago coworking",
  "plataforma coworking SaaS",
];

export const SITE_LOCALE = "es_MX";

/** Absolute URL helper for canonicals and structured data. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const TWITTER_HANDLE = "@espazio_app";

/* ── Contacto / soporte ──────────────────────────────────────────────
   Centralizado para usarse en footer, página de contacto y correos.
   Si el chat de WhatsApp no abre, prueba con "521" en vez de "52". */

/** Número en formato legible para mostrar. */
export const SUPPORT_WHATSAPP_DISPLAY = "951 580 8498";

/** Número en formato internacional (MX = 52) para enlaces wa.me. */
export const SUPPORT_WHATSAPP_E164 = "529515808498";

/** Enlace directo de WhatsApp con mensaje prellenado. */
export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_E164}?text=${encodeURIComponent(
  "Hola, quiero saber más sobre Espazio para mi coworking.",
)}`;

/** Correo de soporte (reenvía a la bandeja del equipo vía Cloudflare). */
export const SUPPORT_EMAIL = "ayuda@espazio.com";

export const SUPPORT_EMAIL_URL = `mailto:${SUPPORT_EMAIL}`;
