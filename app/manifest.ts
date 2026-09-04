import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Galleywood Pharmacy — Staff Leave & Rota",
    short_name: "Galleywood Leave",
    description: "Staff leave requests, approvals, calendar and shift coverage for Galleywood Pharmacy.",
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