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
