import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "#1E3A8A",
          color: "#F5F8FF",
          fontSize: 84,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        GP
      </div>
    ),
    { ...size }
  );
}