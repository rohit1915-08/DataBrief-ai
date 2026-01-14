import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DataBrief AI",
    short_name: "DataBrief",
    description: "Instant AI Business Analyst & Strategic Consultant",
    start_url: "/",
    display: "standalone", // This hides the browser UI (URL bar) on phones
    background_color: "#ffffff",
    theme_color: "#4f46e5", // Matches your Indigo/Purple theme
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
