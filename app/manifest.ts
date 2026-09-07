import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "STAR — Smart Team and Rota",
    short_name: "STAR",
    description: "Staff leave requests, approvals, calendar and shift coverage — powered by STAR (Smart Team and Rota).",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F5F8FF",
    theme_color: "#1E3A8A",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}