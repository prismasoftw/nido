import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Generated "E" monogram on the brand gradient — served at /icon.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4f46e5 0%, #d97706 100%)",
          color: "white",
          fontSize: 340,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        E
      </div>
    ),
    { ...size },
  );
}
