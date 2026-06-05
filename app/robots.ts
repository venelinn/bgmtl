import type { MetadataRoute } from "next";
import { isIndexableEnv } from "@/utils/seo";

// Native robots route. Replaces next-sitemap's generated public/robots.txt —
// don't ship both (a static public/robots.txt would shadow this route).

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://bgmtl.com").replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  // Staging / preview environments (e.g. develop.bgmtl.com) must not be indexed.
  if (!isIndexableEnv(BASE_URL)) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

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
