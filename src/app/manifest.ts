import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "Meckvy — Guesthouse inbox",
    short_name: "Meckvy",
    description:
      "Guest enquiries, your booking page and replies in any language — in your pocket.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf8f4",
    theme_color: "#0d6b6e",
    categories: ["business", "travel", "productivity"],
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Inbox", url: "/dashboard/inbox", icons: [{ src: "/app-icon/96", sizes: "96x96" }] },
      { name: "My booking page", url: "/dashboard/my-page", icons: [{ src: "/app-icon/96", sizes: "96x96" }] },
    ],
  };
}
