import type { MetadataRoute } from "next";

// Azul primário da marca (= token --cor-primaria em globals.css). O manifest exige
// cor literal (não referencia var CSS); mantido numa constante única pra não espalhar.
const AZUL = "#2B54FF";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fit Tracker",
    short_name: "Fit Tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: AZUL,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
