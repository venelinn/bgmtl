/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import { createClient, type EntryCollection, type EntrySkeletonType } from "contentful";
import { IS_DEV, normalizeSlug, PAGE_TYPE } from "./common";
import { cachedContentful } from "./contentful-cache";
import { getContentfulLocale, localization } from "./localization";

const deliveryClient = createClient({
  accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN || "",
  space: process.env.CONTENTFUL_SPACE_ID || "",
  environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
  host: "cdn.contentful.com",
});

const previewClient = process.env.CONTENTFUL_PREVIEW_TOKEN
  ? createClient({
      accessToken: process.env.CONTENTFUL_PREVIEW_TOKEN || "",
      space: process.env.CONTENTFUL_SPACE_ID || "",
      environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
      host: process.env.CONTENTFUL_HOST || "preview.contentful.com",
    })
  : null;

const getClient = (isPreview?: boolean) => {
  if (isPreview && previewClient) return previewClient;
  if (isPreview && !previewClient) {
    console.warn("Preview client requested but CONTENTFUL_PREVIEW_TOKEN is missing. Falling back to delivery client.");
  }
  return deliveryClient;
};

// Utility function to safely determine the Contentful locale and fetch entries
// Utility function to safely determine the Contentful locale and fetch entries
async function getEntries<T extends EntrySkeletonType = EntrySkeletonType>(
  content_type: string,
  queryParams: { locale: string; [key: string]: unknown },
  options?: { preview?: boolean },
): Promise<EntryCollection<T>> {
  const client = getClient(options?.preview);
  const { locale } = queryParams;

  let contentfulLocale: string;
  if (localization.contentfulLocales.includes(locale)) {
    contentfulLocale = locale;
  } else {
    contentfulLocale = getContentfulLocale?.(locale) || localization.contentfulLocales[0];
  }

  if (!contentfulLocale) {
    console.error("No valid contentful locale found or defaulted.");
    return { items: [], total: 0, skip: 0, limit: 0, sys: {} as any };
  }

  // Prepare base parameters
  const params: any = {
    ...queryParams,
    locale: contentfulLocale,
    include: 10,
  };

  const preview = options?.preview ?? false;

  // Cache the delivery fetch indefinitely under the shared "contentful" tag.
  // Ordinary traffic/crawlers hit this cache and spend ZERO Contentful calls;
  // the publish webhook (revalidateTag) is the only thing that refetches.
  // Preview/draft reads bypass the cache so editors always see fresh drafts.
  return cachedContentful(
    () => client.getEntries<T>({ content_type, ...params }),
    [content_type, JSON.stringify(params), String(preview)],
    { bypass: preview },
  );
}
/**
 * Resolves the preview path for an entry ID. Used by the preview API route to redirect
 * to the actual page being previewed instead of the homepage.
 * Supports: page. Returns null for unsupported types or on error (caller should fall back to homepage).
 */
export async function getPreviewPathForEntry(entryId: string, locale: string): Promise<string | null> {
  const client = getClient(true);
  const contentfulLocale = getContentfulLocale(locale);
  try {
    const entry = await client.getEntry(entryId, { locale: contentfulLocale });
    const contentType = entry.sys?.contentType?.sys?.id;
    const fields = (entry.fields || {}) as Record<string, unknown>;

    if (contentType === PAGE_TYPE) {
      const slug = fields.slug as string | undefined;
      if (!slug) return null;
      const path = slug === "/" ? "" : String(slug).replace(/^\/+|\/+$/g, "");
      return `/${locale}${path ? `/${path}` : ""}`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches a single page entry by its slug.
 *
 * Wrapped in React `cache()` so the two calls per request (generateMetadata +
 * the page body) dedupe into one — important in preview, where the data cache
 * is bypassed and both calls would otherwise hit Contentful.
 */
async function fetchPageBySlug(slug: string, locale: string, preview?: boolean) {
  // Handle homepage slug
  const pageSlug = slug === "/" ? "/" : slug;

  // Preview/draft mode must always read fresh from the Preview API, so keep the
  // targeted single-entry fetch (it bypasses the data cache via the preview flag).
  if (preview) {
    return fetchPageBySlugDirect(pageSlug, locale, true);
  }

  // Non-preview: reuse the cached all-pages fetch (`getPages`) and resolve the
  // slug in memory instead of issuing a separate `fields.slug`-filtered query
  // per page. `getPages` is already cached indefinitely under the "contentful"
  // tag, so the nav (layout) AND every page body share ONE Contentful call per
  // publish cycle / build — not the previous "1 all-pages + N per-slug" calls.
  //
  // NOTE: `getPages` uses `include: 10`; if the combined page graph ever exceeds
  // Contentful's ~1000-link include ceiling, deep links on a page could come
  // back unresolved. The not-found fallback below re-fetches that single page on
  // its own (a smaller, fully-resolved response) to stay correct.
  const pages = await getPages(locale);

  const leafSlug = pageSlug.includes("/") ? pageSlug.split("/").filter(Boolean).slice(-1)[0] || pageSlug : null;

  const match =
    pages.find((p: any) => p?.slug === pageSlug) ??
    (leafSlug ? pages.find((p: any) => p?.slug === leafSlug) : undefined);

  if (match) {
    // Clone so the in-place BG-heading injection never mutates the object held
    // by the (dev) all-pages memo, which is shared across requests.
    const page = structuredClone(match) as any;

    if (page && Array.isArray(page.sections)) {
      await injectBulgarianHeadingsInSections(page.sections);
    }

    return page;
  }

  // Not present in the all-pages set (or a truncated include graph) — fall back
  // to the targeted fetch so nested/edge-case slugs still resolve.
  return fetchPageBySlugDirect(pageSlug, locale, false);
}

/**
 * Targeted single-page fetch by slug, with a leaf-slug retry: if a nested path
 * like `/about-us/mission` doesn't match, it retries with the leaf (`mission`),
 * so the route works even when Contentful stores only the child slug.
 *
 * Used for preview reads (must be fresh) and as the not-found fallback for the
 * cached all-pages path above.
 */
async function fetchPageBySlugDirect(pageSlug: string, locale: string, preview?: boolean) {
  const { items } = await getEntries(
    PAGE_TYPE,
    {
      locale,
      "fields.slug": pageSlug,
      limit: 1,
    },
    { preview },
  );

  if (items.length === 0 && pageSlug.includes("/")) {
    const leafSlug = pageSlug.split("/").filter(Boolean).slice(-1)[0] || pageSlug;
    const fallback = await getEntries(
      PAGE_TYPE,
      {
        locale,
        "fields.slug": leafSlug,
        limit: 1,
      },
      { preview },
    );

    if (fallback.items.length > 0) {
      const page = mapEntry(fallback.items[0]);

      if (page && page.sections && Array.isArray(page.sections)) {
        await injectBulgarianHeadingsInSections(page.sections);
      }

      return page;
    }
  }

  if (items.length > 0) {
    const page = mapEntry(items[0]);

    // Inject Bulgarian headings for all embedded event references
    if (page && page.sections && Array.isArray(page.sections)) {
      await injectBulgarianHeadingsInSections(page.sections);
    }

    return page;
  }
  return null;
}

export const getPageBySlug = cache(fetchPageBySlug);

// Helper to recursively inject Bulgarian headings in all nested components/items
async function injectBulgarianHeadingsInSections(sections: any[]): Promise<void> {
  const bgHeadingsMap = await getBulgarianEventHeadingsMap();

  function processItem(item: any): void {
    if (!item) return;

    // If this is an event, inject bgHeading
    if (item.type === "event" && item.id) {
      const bgHeadingText = bgHeadingsMap.get(item.id);
      if (bgHeadingText) {
        item.bgHeading = bgHeadingText;
      }
    }

    // Recursively process nested structures
    const nestedArrays = ["sections", "components", "items", "content", "cards"];
    for (const key of nestedArrays) {
      if (Array.isArray(item[key])) {
        item[key].forEach(processItem);
      }
    }
  }

  sections.forEach(processItem);
}

// --- END NEW FUNCTION ---

export async function getPagePaths(locale: string) {
  const { items } = await getEntries(PAGE_TYPE, { locale });

  return items
    .filter((x: any) => !["/media"].includes(x.fields.slug))
    .map((page: any) => {
      const slug = page.fields.slug.split("/").filter(Boolean);
      return {
        params: { slug },
        locale: page.sys.locale.split("-")[0],
      };
    });
}

export async function getPages(locale: string, preview?: boolean) {
  const response = await getEntries(PAGE_TYPE, { locale }, { preview }); // 💡 Pass preview here
  return response.items.map((entry) => mapEntry(entry));
}

export async function getHeader(locale: string, preview?: boolean) {
  const { items } = await getEntries("header", { locale }, { preview });

  if (items.length > 0) {
    return mapEntry(items[0]);
  }
  return null;
}

export async function getFooter(locale: string, preview?: boolean) {
  const { items } = await getEntries("footer", { locale }, { preview });

  if (items.length > 0) {
    return mapEntry(items[0]);
  }
  return null;
}

export type SiteConfig = {
  fallbackEvents?: { src?: string; url?: string; secure_url?: string } | Record<string, unknown>;
  fallbackEvent?: { src?: string; url?: string; secure_url?: string } | Record<string, unknown>;
  fallbackNews?: { src?: string; url?: string; secure_url?: string } | Record<string, unknown>;
  listingEvents?: number;
  listingNews?: number;
  eventsHero?: Record<string, unknown>[];
  eventsPerPage?: number;
  [key: string]: unknown;
};

/** Extracts image URL from site config fallback (Cloudinary asset, JSON, Link to cloudinaryAsset, or array of images). */
export function getFallbackImageUrl(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;

  // Contentful returns fallbackEvent/fallbackEvents as array: [{ src, alt, width, height }]
  if (Array.isArray(obj) && obj[0]) {
    const first = obj[0] as Record<string, unknown>;
    const url = (first.secure_url ?? first.url ?? first.src) as string | undefined;
    if (typeof url === "string" && url) return url;
  }

  const o = obj as Record<string, unknown>;

  // Try top-level: secure_url, url, src (raw JSON or Cloudinary object)
  const topLevel = (o.secure_url ?? o.url ?? o.src ?? o.original_secure_url ?? o.original_url) as string | undefined;
  if (typeof topLevel === "string" && topLevel) return topLevel;

  // Link to cloudinaryAsset: image is array like [{ url, secure_url }]
  const image = o.image;
  if (Array.isArray(image) && image[0]) {
    const first = image[0] as Record<string, unknown>;
    const imgUrl = (first.secure_url ?? first.url ?? first.src) as string | undefined;
    if (typeof imgUrl === "string" && imgUrl) return imgUrl;
  }
  if (image && typeof image === "object" && !Array.isArray(image)) {
    const img = image as Record<string, unknown>;
    const imgUrl = (img.secure_url ?? img.url ?? img.src) as string | undefined;
    if (typeof imgUrl === "string" && imgUrl) return imgUrl;
  }

  return null;
}

/** Fetches site configuration (single entry). Tries siteConfiguration, then siteConfig. */
export async function getSiteConfig(locale: string, preview?: boolean): Promise<SiteConfig | null> {
  for (const contentType of ["siteConfiguration", "siteConfig"]) {
    try {
      const { items } = await getEntries(contentType, { locale, limit: 1 }, { preview });
      if (items.length > 0) {
        let config = mapEntry(items[0]) as SiteConfig;
        // If fallback fields missing (e.g. only in default locale), try default locale
        const defaultLocale = localization.contentfulLocales[0];
        if ((!config.fallbackEvent && !config.fallbackEvents) && locale !== defaultLocale) {
          const { items: defaultItems } = await getEntries(contentType, {
            locale: defaultLocale,
            limit: 1,
          }, { preview });
          if (defaultItems.length > 0) {
            const defaultConfig = mapEntry(defaultItems[0]) as SiteConfig;
            config = {
              ...config,
              fallbackEvent: config.fallbackEvent ?? defaultConfig.fallbackEvent,
              fallbackEvents: config.fallbackEvents ?? defaultConfig.fallbackEvents,
              fallbackNews: config.fallbackNews ?? defaultConfig.fallbackNews,
            };
          }
        }
        return config;
      }
    } catch {
      // try next content type
    }
  }
  return null;
}

export type MembershipTier = {
  value: string;
  label: string;
  amount?: string;
};

export type MembershipConfig = {
  title?: string;
  description?: string;
  selectLabel?: string;
  buttonLabel?: string;
  trustText?: string;
  hostedButtonId?: string;
  paypalOptionName?: string;
  currencyCode?: string;
  paypalAction?: string;
  tiers?: MembershipTier[];
};

/** Fetches the Membership widget singleton (membershipWidget content type). */
export async function getMembershipConfig(locale: string, preview?: boolean): Promise<MembershipConfig | null> {
  try {
    const { items } = await getEntries("membershipWidget", { locale, limit: 1 }, { preview });
    if (items.length === 0) return null;

    const mapped = mapEntry(items[0]) as MembershipConfig & { tiers?: any[] };
    // tiers are resolved entry references — normalize to plain {value,label,amount}.
    const tiers = Array.isArray(mapped.tiers)
      ? mapped.tiers
          .filter((t: any) => t && t.value)
          .map((t: any) => ({ value: t.value, label: t.label ?? t.value, amount: t.amount }))
      : [];

    return { ...mapped, tiers };
  } catch {
    // content type may not exist yet (migration not run)
    return null;
  }
}

export async function getMediaItems(locale: string) {
  try {
    const response = await getEntries("media", { locale });

    if (!response.items) {
      console.error("No items found in the response:", response);
      return [];
    }

    return response.items.map((entry) => mapEntry(entry));
  } catch (error) {
    console.error("Error fetching media items:", error);
    return [];
  }
}

export async function getContentItems(contentType: string = "media", locale: string) {
  try {
    const response = await getEntries(contentType, { locale });

    if (!response.items) {
      console.error(`No items found in the response for content type: ${contentType}`, response);
      return [];
    }

    return response.items.map((entry) => mapEntry(entry));
  } catch (error) {
    console.error(`Error fetching items for content type: ${contentType}`, error);
    return [];
  }
}

// Fetch a single item by ID
export async function getContentItem(contentType: string, id: string, locale: string, preview?: boolean) {
  const client = getClient(preview); // 💡 Use the flag here!
  const res = await cachedContentful(
    () => client.getEntries({ content_type: contentType, "sys.id": id, locale }),
    ["item", contentType, id, locale],
    { bypass: !!preview },
  );
  return res.items[0].fields;
}

// *** ADDED HELPER FUNCTION: Fetch multiple items by ID ***
export async function getProductItemsByIds(ids: string[], locale: string) {
  if (!ids || ids.length === 0) return [];

  // We fetch products based on their system IDs
  const res = await getEntries("product", {
    locale,
    "sys.id[in]": ids.join(","),
    limit: 100, // Set a reasonable limit for cart items
  });

  // Map the raw products using mapEntry for full field and asset resolution
  return res.items.map((entry) => mapEntry(entry));
}

// Cache for Bulgarian event headings (to avoid repeated fetches)
/**
 * Maps every Bulgarian event id → its heading text. Localized event references
 * derive their slug from the BG heading, so this is injected as `bgHeading`.
 *
 * The underlying `getEntries` call is cached indefinitely under the "contentful"
 * tag and busted by the publish webhook — so the data is always fresh after a
 * publish. Wrapped in React `cache()` only to dedupe the Map rebuild within a
 * single request/build. (It used to be a module-level `let` memo, which the
 * webhook never invalidated — it stayed stale until the server process recycled.)
 */
const getBulgarianEventHeadingsMap = cache(async (): Promise<Map<string, string>> => {
  const bgLocale = getContentfulLocale("bg");
  const { items: bgItems } = await getEntries("event", { locale: bgLocale, limit: 100 });

  // First map the entries to resolve references
  const mappedBgEvents = bgItems.map((entry) => mapEntry(entry, "bg"));

  return new Map(
    mappedBgEvents.map((bgEvent: any) => {
      // Extract heading text using the same logic as Event.tsx
      let headingText = "";

      if (typeof bgEvent.heading === "string") {
        headingText = bgEvent.heading;
      } else if (bgEvent.heading && typeof bgEvent.heading === "object" && "heading" in bgEvent.heading) {
        headingText = bgEvent.heading.heading;
      }

      return [bgEvent.id, headingText];
    }),
  );
});

async function injectBulgarianHeadings(entries: any[]): Promise<any[]> {
  const bgHeadingsMap = await getBulgarianEventHeadingsMap();

  return entries.map((entry) => {
    if (entry && entry.type === "event" && entry.id) {
      const bgHeadingText = bgHeadingsMap.get(entry.id);
      if (bgHeadingText) {
        entry.bgHeading = bgHeadingText;
      }
    }
    return entry;
  });
}

function mapEntry(entry: any, localePassed?: string) {
  const id = entry.sys?.id;
  const type = entry.sys?.contentType?.sys?.id || entry.sys?.type;
  const locale = entry.sys?.locale?.split("-")[0] || localePassed;

  if (entry?.type === "upload") {
    const { public_id, resource_type, secure_url } = entry;

    return {
      id: public_id,
      type: resource_type,
      src: secure_url,
      alt: "",
      locale,
      width: entry.width,
      height: entry.height,
    };
  }

  if (entry.fields) {
    const mapped = {
      id,
      type,
      locale,
      // Real content update time (used by the sitemap for <lastmod>). Prefixed
      // with "_" like _rawHeading so it never collides with a CMS field name.
      _updatedAt: entry.sys?.updatedAt,
      ...Object.fromEntries(
        Object.entries(entry.fields).map(([key, value]) => {
          // Link entries use a CMS `type` field (link | button) — keep sys content type on `type`
          const fieldKey = key === "type" && type === "link" ? "linkPresentation" : key;
          return [fieldKey, parseField(value, locale)];
        }),
      ),
    };

    // For event type entries, store raw heading for Bulgarian slug extraction later
    if (type === "event" && entry.fields.heading) {
      (mapped as any)._rawHeading = entry.fields.heading;
    }
    if (type === "news" && entry.fields.heading) {
      (mapped as any)._rawHeading = entry.fields.heading;
    }

    return mapped;
  }
  return null;
}

function isLocaleFieldMap(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  return keys.every((k) => /^[a-z]{2}(-[A-Z]{2})?$/i.test(k));
}

/** Flatten `{ "bg-BG": doc }` when a field was not resolved to the request locale. */
function unwrapLocaleField(value: unknown, locale: string): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  if ("sys" in value && (value as { sys?: unknown }).sys) return value;
  if ((value as { nodeType?: string }).nodeType === "document") return value;

  const record = value as Record<string, unknown>;
  if (!isLocaleFieldMap(record)) return value;

  const contentfulLocale = getContentfulLocale(locale);
  return (
    record[contentfulLocale] ??
    record[locale] ??
    record["bg-BG"] ??
    record["en-CA"] ??
    Object.values(record)[0]
  );
}

function parseField(value: any, locale: string) {
  if (typeof value === "object" && value?.sys) return mapEntry(value, locale);
  if (Array.isArray(value)) {
    return value.map((v) => {
      // If array item is a primitive (string, number, boolean), return it as-is
      if (typeof v !== "object" || v === null) return v;
      // Otherwise, map it as an entry
      return mapEntry(v, locale);
    });
  }
  return unwrapLocaleField(value, locale);
}

async function getContentModel(contentType: string, locale: string) {
  try {
    // Use the safe getEntries wrapper which handles locale validation and includes: 10
    const entries = await getEntries(contentType, { locale });

    // Map all returned items (which should be published by CDN) for full field resolution
    return entries.items.map((entry) => mapEntry(entry, locale));
  } catch (error: any) {
    console.warn(`⚠️ Contentful: Could not fetch ${contentType} (${locale}) → ${error.message}`);
    return []; // <- don’t throw, just return empty
  }
}

export async function getNavigationLinks(pages: any[], locale: string) {
  const navigationLinks = pages
    .filter((e) => e.locale === locale)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((e) => ({
      // Access standard page field using camelCase (pageName)
      pageName: e.pageName,
      slug: normalizeSlug(e.slug),
      locale: e.locale,
      order: e.order ?? null,
      location: e.location ?? null,
    }));

  return navigationLinks;
}

export async function getEventById(id: string, locale: string, preview?: boolean) {
  const contentfulLocale = getContentfulLocale(locale);
  const { items } = await getEntries("event", { locale: contentfulLocale, "sys.id": id }, { preview });

  if (items.length > 0) {
    return mapEntry(items[0]);
  }
  return null;
}

/** Fetch one published `newsletter` entry (with its referenced events resolved). */
export async function getNewsletterById(id: string, locale: string, preview?: boolean) {
  const contentfulLocale = getContentfulLocale(locale);
  const { items } = await getEntries("newsletter", { locale: contentfulLocale, "sys.id": id }, { preview });

  if (items.length > 0) {
    return mapEntry(items[0], locale);
  }
  return null;
}

export async function getAllEventIds(locale: string, preview?: boolean) {
  const contentfulLocale = getContentfulLocale(locale);
  const { items } = await getEntries("event", { locale: contentfulLocale, limit: 100 }, { preview });

  return items.map((item) => ({
    id: item.sys.id,
    locale: item.sys.locale?.split("-")[0] || locale,
  }));
}

export async function getAllEvents(locale: string, preview?: boolean) {
  const contentfulLocale = getContentfulLocale(locale);

  // Fetch events for the requested locale
  const { items: localizedItems } = await getEntries("event", { locale: contentfulLocale, limit: 100 }, { preview });

  // Get Bulgarian headings map
  const bgHeadingsMap = await getBulgarianEventHeadingsMap();

  // Map entries and inject Bulgarian heading for slug generation
  return localizedItems.map((entry: any) => {
    const mapped = mapEntry(entry, locale);
    const bgHeadingText = bgHeadingsMap.get(entry.sys.id);

    // Add Bulgarian heading as a separate property for reliable slug generation
    if (mapped && bgHeadingText) {
      mapped.bgHeading = bgHeadingText;
    }

    return mapped;
  });
}

// Always fetch Bulgarian version for slug generation (to ensure consistent URLs across all locales)
export async function getAllEventsBulgarian(preview?: boolean) {
  const bgLocale = getContentfulLocale("bg");
  const { items } = await getEntries("event", { locale: bgLocale, limit: 100 }, { preview });

  return items.map((entry) => mapEntry(entry, "bg"));
}

// --- News ---
let bgNewsHeadingsCache: Map<string, string> | null = null;

async function getBulgarianNewsHeadingsMap(): Promise<Map<string, string>> {
  if (bgNewsHeadingsCache) return bgNewsHeadingsCache;

  const bgLocale = getContentfulLocale("bg");
  const { items: bgItems } = await getEntries("news", { locale: bgLocale, limit: 100 });

  const mappedBgNews = bgItems.map((entry) => mapEntry(entry, "bg"));

  bgNewsHeadingsCache = new Map(
    mappedBgNews.map((bgNews: any) => {
      let headingText = "";
      if (typeof bgNews.heading === "string") {
        headingText = bgNews.heading;
      } else if (bgNews.heading && typeof bgNews.heading === "object" && "heading" in bgNews.heading) {
        headingText = bgNews.heading.heading;
      }
      return [bgNews.id, headingText];
    }),
  );

  return bgNewsHeadingsCache;
}

export async function getAllNews(locale: string, preview?: boolean) {
  const contentfulLocale = getContentfulLocale(locale);
  const { items: localizedItems } = await getEntries("news", { locale: contentfulLocale, limit: 100 }, { preview });
  const bgHeadingsMap = await getBulgarianNewsHeadingsMap();

  return localizedItems.map((entry: any) => {
    const mapped = mapEntry(entry, locale);
    const bgHeadingText = bgHeadingsMap.get(entry.sys.id);
    if (mapped && bgHeadingText) {
      mapped.bgHeading = bgHeadingText;
    }
    return mapped;
  });
}

export async function getAllNewsBulgarian(preview?: boolean) {
  const bgLocale = getContentfulLocale("bg");
  const { items } = await getEntries("news", { locale: bgLocale, limit: 100 }, { preview });
  return items.map((entry) => mapEntry(entry, "bg"));
}

export type ListingsSection = {
  type: "events" | "news";
  cards: Array<{ type: string; date?: string; [key: string]: unknown }>;
  hasMore: boolean;
};

export type ListingsDataResult = {
  sections: ListingsSection[];
  siteConfig: SiteConfig | null;
};

/**
 * Fetches listing data for Page model "listings" field.
 * Returns separate sections for events and news, each with its own limit from site config.
 */
export async function getListingsData(
  listingTypes: string[],
  locale: string,
  options?: { limit?: number; preview?: boolean },
): Promise<ListingsDataResult> {
  const defaultLimit = options?.limit ?? 5;
  const preview = options?.preview ?? false;
  const sections: ListingsSection[] = [];

  const siteConfig = await getSiteConfig(locale, preview);
  const eventsLimit = siteConfig?.listingEvents ?? defaultLimit;
  const newsLimit = siteConfig?.listingNews ?? defaultLimit;

  for (const listingType of listingTypes) {
    if (listingType === "events") {
      const events = await getAllEvents(locale, preview);
      const eventCards = events.map((e) => ({ ...e, type: "event" }));
      // Match the /events listing order: upcoming events soonest-first, then
      // past events newest-first. A plain date-descending sort would surface
      // the furthest-future event first, so the home teaser and any events
      // listing preview would disagree with the dedicated events page.
      const now = Date.now();
      const sorted = eventCards.sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        const aUpcoming = dateA >= now;
        const bUpcoming = dateB >= now;
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
        return aUpcoming ? dateA - dateB : dateB - dateA;
      });
      sections.push({
        type: "events",
        cards: sorted.slice(0, eventsLimit),
        hasMore: sorted.length > eventsLimit,
      });
    }
    if (listingType === "news") {
      try {
        const news = await getAllNews(locale, preview);
        const newsCards = news.map((item) => ({ ...item, type: "news" }));
        const sorted = newsCards.sort((a, b) => {
          const dateA = new Date(a.date || 0).getTime();
          const dateB = new Date(b.date || 0).getTime();
          return dateB - dateA;
        });
        sections.push({
          type: "news",
          cards: sorted.slice(0, newsLimit),
          hasMore: sorted.length > newsLimit,
        });
      } catch {
        // news content type may not exist yet
      }
    }
  }

  return { sections, siteConfig };
}

/**
 * Fetches only upcoming/available events (future dates)
 * Useful for calendars and event listings that should only show future events
 */
export async function getAvailableEvents(locale: string, preview?: boolean) {
  const allEvents = await getAllEvents(locale, preview);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter to only future events and sort by date ascending
  return allEvents
    .filter((event: any) => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
}

// --- Community directory (query-driven by city) ---

export type DirectoryData = {
  categories: { slug: string; label: string; order?: number }[];
  items: {
    id: string;
    /** Category slugs this entry is tagged with (matches DirectoryCategory slugs). */
    categorySlugs: string[];
    title: string;
    searchText?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    note?: string;
    /** Resolved logo image URL (Cloudinary/Contentful asset), if set. */
    logo?: string;
  }[];
};

/**
 * Fetches everything the directory needs for a given `city`: the category
 * taxonomy (communityCategory, with localized labels) and every `directoryEntry`
 * tagged with that city, mapped to DirectoryCard-ready items.
 *
 * Query-driven on purpose: editors add an org by creating a directoryEntry and
 * setting `city` + `categories` — no manual collection wiring.
 */
export async function getCommunityDirectory(
  city: string,
  locale: string,
  preview?: boolean,
): Promise<DirectoryData> {
  const contentfulLocale = getContentfulLocale(locale);

  // Fetch independently so one failing query (transient 5xx, rate-limit) degrades
  // gracefully instead of blanking the whole directory.
  const safe = async <T>(label: string, p: Promise<T>): Promise<T | null> => {
    try {
      return await p;
    } catch (err) {
      console.error(`getCommunityDirectory: ${label} fetch failed`, err);
      return null;
    }
  };
  const [cardsRes, catsRes] = await Promise.all([
    safe(
      "entries",
      getEntries("directoryEntry", { locale: contentfulLocale, "fields.city": city, limit: 500 }, { preview }),
    ),
    safe(
      "categories",
      getEntries("communityCategory", { locale: contentfulLocale, order: "fields.order", limit: 200 }, { preview }),
    ),
  ]);

  const categories = ((catsRes?.items ?? []).map((e) => mapEntry(e)) as any[])
    .filter((c) => c?.slug)
    .map((c) => ({
      slug: c.slug as string,
      label: (c.label ?? c.slug) as string,
      order: c.order as number | undefined,
    }));

  const items = ((cardsRes?.items ?? []).map((e) => mapEntry(e)) as any[])
    .map((entry) => {
      const title: string = entry?.name || entry?.heading?.heading || entry?.title || "";
      const cats = (Array.isArray(entry?.categories) ? entry.categories : []).filter(Boolean) as any[];
      const categorySlugs = cats.map((c) => c?.slug as string).filter(Boolean);
      const categoryLabels = cats.map((c) => c?.label as string).filter(Boolean);
      const phone = (entry?.phone as string) || undefined;
      const email = (entry?.email as string) || undefined;
      const website = (entry?.website as string) || undefined;
      const address = (entry?.address as string) || undefined;
      const note = (entry?.note as string) || undefined;
      const logo = getFallbackImageUrl(entry?.logo) || undefined;
      const searchText = [title, address, note, ...categoryLabels].filter(Boolean).join(" ").toLowerCase();
      return {
        id: entry?.id as string,
        categorySlugs,
        title,
        searchText,
        phone,
        email,
        website,
        address,
        note,
        logo,
      };
    })
    .filter((it) => it.id && it.title);

  return { categories, items };
}

export type LatestDirectoryEntry = {
  id: string;
  title: string;
  /** Category labels — rendered as the small chips on DirectoryCard. */
  tags: string[];
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  note?: string;
  logo?: string;
};

/**
 * Fetches the most recently created `directoryEntry` entries for a city (newest
 * first), mapped to DirectoryCard-ready items. Powers the homepage "latest
 * listings" teaser — distinct from getCommunityDirectory, which returns the full
 * filterable set with its category taxonomy.
 */
export async function getLatestDirectoryEntries(
  locale: string,
  limit = 3,
  preview?: boolean,
  city = "montreal",
): Promise<LatestDirectoryEntry[]> {
  const contentfulLocale = getContentfulLocale(locale);
  try {
    const res = await getEntries(
      "directoryEntry",
      { locale: contentfulLocale, "fields.city": city, order: "-sys.createdAt", limit },
      { preview },
    );
    return ((res?.items ?? []).map((e) => mapEntry(e)) as any[])
      .map((entry) => {
        const title: string = entry?.name || entry?.heading?.heading || entry?.title || "";
        const cats = (Array.isArray(entry?.categories) ? entry.categories : []).filter(Boolean) as any[];
        const tags = cats.map((c) => c?.label as string).filter(Boolean);
        return {
          id: entry?.id as string,
          title,
          tags,
          phone: (entry?.phone as string) || undefined,
          email: (entry?.email as string) || undefined,
          website: (entry?.website as string) || undefined,
          address: (entry?.address as string) || undefined,
          note: (entry?.note as string) || undefined,
          logo: getFallbackImageUrl(entry?.logo) || undefined,
        };
      })
      .filter((it) => it.id && it.title);
  } catch (err) {
    console.error("getLatestDirectoryEntries: fetch failed", err);
    return [];
  }
}
