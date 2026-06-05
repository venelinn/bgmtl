/* eslint-disable @typescript-eslint/no-explicit-any */
// Data source for app/sitemap.ts: every URL that should appear in the sitemap,
// pulled from Contentful and CACHED. It reuses the project's existing fetchers
// (getPages / getAllEventsBulgarian / getAllNewsBulgarian), which already route
// through `cachedContentful` — so regenerating the sitemap costs ~0 Contentful
// API calls. The outer cachedContentful wrap also memoizes the assembled list
// (and ties it to the "contentful" tag, so the publish webhook refreshes it).
//
// URL scheme (see localization.defaultLocale): the default locale (bg) is served
// at the ROOT with no prefix; other locales (en) are prefixed (/en/...). Event
// and news slugs are derived from the Bulgarian heading, so they are identical
// across locales — which lets app/sitemap.ts pair them as hreflang alternates.

import { slugify } from "./common";
import { cachedContentful } from "./contentful-cache";
import { getAllEventsBulgarian, getAllNewsBulgarian, getPages } from "./content";
import { localization } from "./localization";

export type SitemapPath = {
  /** App locale, e.g. "bg" / "en". */
  locale: string;
  /** Path WITHOUT any locale prefix, no leading/trailing slashes. "" = home. */
  pathSegments: string;
  /** From the entry's `sys.updatedAt` (falls back to build time). */
  lastModified: Date;
};

/** Locales to emit, in app form. Sourced from the single localization config. */
export const SITEMAP_LOCALES = localization.locales;

/** CMS page slugs to keep out of the sitemap (exact match or `${slug}/` prefix). */
const EXCLUDED_SLUGS: string[] = [];

/** Extract a plain heading string from the various shapes events/news use. */
function headingText(heading: unknown): string {
  if (typeof heading === "string") return heading;
  if (heading && typeof heading === "object" && "heading" in heading) {
    const inner = (heading as { heading?: unknown }).heading;
    if (typeof inner === "string") return inner;
  }
  return "";
}

function isExcluded(slug: string): boolean {
  return EXCLUDED_SLUGS.some((s) => slug === s || slug.startsWith(`${s}/`));
}

function toDate(value: unknown): Date {
  return typeof value === "string" ? new Date(value) : new Date();
}

async function buildSitemapPaths(): Promise<SitemapPath[]> {
  const out: SitemapPath[] = [];

  // 1. CMS pages + the events listing route, per locale.
  for (const locale of SITEMAP_LOCALES) {
    const pages = await getPages(locale);
    for (const page of pages as any[]) {
      const slug = page?.slug;
      if (typeof slug !== "string" || isExcluded(slug)) continue;
      const pathSegments = slug === "/" ? "" : slug.replace(/^\/+|\/+$/g, "");
      out.push({ locale, pathSegments, lastModified: toDate(page._updatedAt) });
    }
    // /events is a hardcoded route, not a CMS page entry.
    out.push({ locale, pathSegments: "events", lastModified: new Date() });
  }

  // 2. Event detail pages. Slug comes from the Bulgarian heading (locale-independent,
  //    matching the route's generateStaticParams), so emit it for every locale.
  const bgEvents = (await getAllEventsBulgarian()) as any[];
  for (const event of bgEvents) {
    if (!event) continue;
    const slug = slugify(headingText(event.heading) || event.venue || "event");
    const lastModified = toDate(event._updatedAt);
    for (const locale of SITEMAP_LOCALES) {
      out.push({ locale, pathSegments: `events/${slug}`, lastModified });
    }
  }

  // 3. News detail pages — same slug-from-bg-heading rule.
  const bgNews = (await getAllNewsBulgarian()) as any[];
  for (const item of bgNews) {
    if (!item) continue;
    const slug = slugify(headingText(item.heading) || "news");
    const lastModified = toDate(item._updatedAt);
    for (const locale of SITEMAP_LOCALES) {
      out.push({ locale, pathSegments: `news/${slug}`, lastModified });
    }
  }

  return out;
}

/**
 * Cached entry point for app/sitemap.ts. Result is cached indefinitely and only
 * refetched after the publish webhook busts the `contentful` tag.
 */
export function getSitemapPaths(): Promise<SitemapPath[]> {
  return cachedContentful(buildSitemapPaths, ["sitemap-paths"]);
}
