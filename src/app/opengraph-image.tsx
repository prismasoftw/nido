import { ImageResponse } from "next/og";

import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share card (Open Graph + Twitter) generated at build time.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(120% 120% at 0% 0%, #1e1b4b 0%, #0b1020 55%, #000000 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 24,
              background: "linear-gradient(135deg, #4f46e5 0%, #d97706 100%)",
              fontSize: 60,
              fontWeight: 700,
            }}
          >
            E
          </div>
          <span style={{ fontSize: 44, fontWeight: 600 }}>{SITE_NAME}</span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            Gestiona tu coworking. Cobra, reserva y crece sin caos.
          </span>
          <span style={{ fontSize: 34, color: "#cbd5e1", maxWidth: 880 }}>
            Reservas, pagos con Mercado Pago, miembros y métricas. Desde $199
            MXN/mes.
          </span>
        </div>

        {/* Footer */}
        <span style={{ fontSize: 30, color: "#94a3b8" }}>espazio.app</span>
      </div>
    ),
    { ...size },
  );
}
