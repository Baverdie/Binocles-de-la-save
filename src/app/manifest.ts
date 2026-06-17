import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Binocles de la Save",
    short_name: "Binocles",
    description: "Opticien indépendant à Levignac",
    start_url: "/",
    display: "standalone",
    background_color: "#E7DAC6",
    theme_color: "#412A1C",
    orientation: "portrait",
    icons: [
      {
        src: "/logo/Favicon Generator/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo/Favicon Generator/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
