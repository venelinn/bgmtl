import type { MetadataRoute } from "next";
import { localization } from "@/utils/localization";
import { getSitemapPaths, SITEMAP_LOCALES } from "@/utils/sitemap-paths";

// Native Next.js App Router sitemap, driven by Contentful and CACHED — the data
// comes from getSitemapPaths → cachedContentful, so regeneration costs ~0 CMS
// API calls. Emits hreflang alternates for the bg/en pair + a real lastModified
// from Contentful `updatedAt`.
//
// No `export const revalidate`: the route is static and is refreshed by the
// publish webhook (revalidatePath("/sitemap.xml") in utils/revalidation.ts),
// keeping the project's "no time-based revalidation" guardrail intact.

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://bgottawa-gatineau.ca").replace(/\/+$/, "");

/** Default locale (bg) lives at the root; other locales are path-prefixed. */
function localePrefix(locale: string): string {
  return locale === localization.defaultLocale ? "" : `/${locale}`;
}

function absoluteUrl(locale: string, pathSegments: string): string {
  const tail = pathSegments ? `/${pathSegments}` : "";
  return `${BASE_URL}${localePrefix(locale)}${tail}` || BASE_URL;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await getSitemapPaths();
  const locales = [...SITEMAP_LOCALES];

  // Group every locale variant of the same page so they can share hreflang.
  type Group = { urls: Record<string, string>; byLocale: Record<string, Date> };
  const groups = new Map<string, Group>();

  for (const row of rows) {
    let g = groups.get(row.pathSegments);
    if (!g) {
      g = { urls: {}, byLocale: {} };
      groups.set(row.pathSegments, g);
    }
    g.urls[row.locale] = absoluteUrl(row.locale, row.pathSegments);
    if (!g.byLocale[row.locale] || row.lastModified > g.byLocale[row.locale]) {
      g.byLocale[row.locale] = row.lastModified;
    }
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const [pathSegments, g] of groups) {
    const languages: Record<string, string> = {};
    for (const loc of locales) if (g.urls[loc]) languages[loc] = g.urls[loc];
    // Only emit hreflang when the page exists in more than one locale.
    const alternates = Object.keys(languages).length > 1 ? { languages } : undefined;

    for (const loc of locales) {
      const url = g.urls[loc];
      if (!url) continue;
      entries.push({
        url,
        lastModified: g.byLocale[loc],
        changeFrequency: pathSegments === "" ? "daily" : "weekly",
        priority: pathSegments === "" ? 1 : 0.8,
        ...(alternates ? { alternates } : {}),
      });
    }
  }

  // Never ship an empty sitemap — at minimum list each locale home.
  if (entries.length === 0) {
    for (const loc of locales) {
      entries.push({
        url: absoluteUrl(loc, ""),
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      });
    }
  }

  return entries.sort((a, b) => a.url.localeCompare(b.url));
}
