import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon — rounded brand tile with an "E" monogram.
export default function AppleIcon() {
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
          fontSize: 120,
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
