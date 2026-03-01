import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ServeConnect",
    short_name: "ServeConnect",
    description: "Connect students with local service opportunities",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f8",
    theme_color: "#2f9a46",
    icons: [
      {
        src: "/icon.png",
        sizes: "1024x1024",
        type: "image/png"
      }
    ]
  };
}
