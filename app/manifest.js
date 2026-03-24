export default function manifest() {
  return {
    name: "Brenado Task Manager",
    short_name: "Brenado",
    description: "Gestiune sarcini tamplarie PVC",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#009c5b",
    orientation: "portrait",
    lang: "ro",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}