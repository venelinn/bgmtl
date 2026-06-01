import type { MetadataRoute } from "next";

// Native robots route. Replaces next-sitemap's generated public/robots.txt —
// don't ship both (a static public/robots.txt would shadow this route).

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://bgottawa-gatineau.ca").replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
