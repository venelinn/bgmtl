import { draftMode } from "next/headers";
import type { ReactNode } from "react";
import { getEventPermalink, getNewsPermalink } from "@/utils/common";
import { getAllEvents, getAllNews, getCommunityDirectory } from "@/utils/content";
import { getLinkFieldsUrl } from "@/utils/linkHelpers";
import { getLocalePrefix } from "@/utils/localization";
import { Hero, type HeroProps } from "./Hero";
import { resolveHeroBodies } from "./heroContent";
import {
  HeroSearch,
  type HeroSearchButton,
  type HeroSearchCategory,
  type HeroSearchSuggestion,
} from "./HeroSearch";

/** Chips shown when `extended` is on but no quick categories were picked. */
const DEFAULT_QUICK_CATEGORIES = 5;
/** Directory city the hero search and chips point at (matches the homepage teaser). */
const DIRECTORY_CITY = "montreal";

type MappedEntry = Record<string, unknown> & { id?: string };

type HeroConnectorProps = HeroProps & {
  media?: HeroProps["images"];
  /** @deprecated Use `content` (Rich Text). Kept until all entries are republished. */
  description?: HeroProps["content"];
  locale?: string;
  searchPlaceholder?: string;
  searchButtonLabel?: string;
  quickLinksLabel?: string;
  quickCategories?: MappedEntry[];
  buttons?: MappedEntry[];
};

function toCategories(entries: MappedEntry[] | undefined): HeroSearchCategory[] {
  return (entries ?? [])
    .filter((c) => typeof c?.slug === "string")
    .map((c) => ({ slug: c.slug as string, label: (c.label ?? c.slug) as string }));
}

// Internal Link entry URLs are stored unprefixed ("/community"); add the locale.
function toButtons(entries: MappedEntry[] | undefined, localePrefix: string): HeroSearchButton[] {
  return (entries ?? []).flatMap((entry) => {
    // mapEntry puts the content type ("link") on `type` and the CMS type field on
    // `linkPresentation`; drop `type` so parseLinkAppearance reads the latter.
    const { type: _contentType, ...fields } = entry;
    const url = getLinkFieldsUrl(fields);
    if (!url || !fields.id) return [];
    const href = url.startsWith("/") && localePrefix && !url.startsWith(`${localePrefix}/`) ? `${localePrefix}${url}` : url;
    const label = (fields.name ?? fields.title ?? "") as string;
    return [{ id: fields.id, href, label, fields }];
  });
}

/** Plain heading text from the string / `{ heading }` shapes events and news use. */
function headingText(heading: unknown): string {
  if (typeof heading === "string") return heading;
  if (heading && typeof heading === "object" && "heading" in heading) return String(heading.heading ?? "");
  return "";
}

// Lean, site-wide autocomplete index (labels + hrefs only) for the hero search.
// Event/news slugs come from the Bulgarian heading, like their cards.
function toSuggestions(
  directoryPath: string,
  categories: HeroSearchCategory[],
  listings: { title: string; searchText?: string }[],
  events: MappedEntry[],
  news: MappedEntry[],
  locale: string,
): HeroSearchSuggestion[] {
  const now = Date.now();
  const time = (e: MappedEntry) => new Date(String(e.date ?? 0)).getTime();
  // Upcoming soonest first, then the archive newest first.
  const sortedEvents = [
    ...events.filter((e) => time(e) > now).sort((a, b) => time(a) - time(b)),
    ...events.filter((e) => time(e) <= now).sort((a, b) => time(b) - time(a)),
  ];

  return [
    ...categories.map((c) => ({
      kind: "category" as const,
      label: c.label,
      text: c.label,
      href: `${directoryPath}/${c.slug}`,
    })),
    ...listings.map((l) => ({
      kind: "listing" as const,
      label: l.title,
      text: l.searchText ?? l.title,
      // Listings have no page of their own: open the directory filtered to it.
      href: `${directoryPath}?q=${encodeURIComponent(l.title)}`,
    })),
    ...sortedEvents.flatMap((e) => {
      const label = headingText(e.heading) || String(e.venue ?? "");
      if (!label) return [];
      const slugTitle = String(e.bgHeading || label);
      return [
        {
          kind: "event" as const,
          label,
          text: `${label} ${e.venue ?? ""}`,
          href: getEventPermalink({ locale, title: slugTitle }),
        },
      ];
    }),
    ...news.flatMap((n) => {
      const label = headingText(n.heading);
      if (!label) return [];
      return [
        {
          kind: "news" as const,
          label,
          text: label,
          href: getNewsPermalink({ locale, title: String(n.bgHeading || label) }),
        },
      ];
    }),
  ];
}

export const HeroConnector = async (props: HeroConnectorProps) => {
  const { description: _legacy, locale, ...rest } = props;
  const bodies = resolveHeroBodies(props as Record<string, unknown>, locale);

  let search: ReactNode = null;
  if (rest.extended) {
    const localePrefix = getLocalePrefix(locale);
    const { isEnabled } = await draftMode();
    const lang = locale ?? "bg";
    // Events/news only feed the autocomplete, so a failed fetch just drops them.
    const [directory, events, news] = await Promise.all([
      getCommunityDirectory(DIRECTORY_CITY, lang, isEnabled),
      getAllEvents(lang, isEnabled).catch(() => []),
      getAllNews(lang, isEnabled).catch(() => []),
    ]);

    // `/community/<slug>` 404s for a category with no listings, so only offer
    // chips that lead somewhere — for picked categories and the fallback alike.
    const listingCounts = new Map<string, number>();
    for (const slug of directory.items.flatMap((item) => item.categorySlugs)) {
      listingCounts.set(slug, (listingCounts.get(slug) ?? 0) + 1);
    }
    const listed = new Set(listingCounts.keys());
    const picked = toCategories(rest.quickCategories).filter((c) => listed.has(c.slug));
    const categories = picked.length
      ? picked
      : directory.categories.filter((c) => listed.has(c.slug)).slice(0, DEFAULT_QUICK_CATEGORIES);

    const directoryPath = `${localePrefix}/community`;
    const suggestions = toSuggestions(
      directoryPath,
      // Most listings first (ties keep the Contentful order: sort is stable).
      directory.categories
        .filter((c) => listed.has(c.slug))
        .sort((a, b) => (listingCounts.get(b.slug) ?? 0) - (listingCounts.get(a.slug) ?? 0)),
      directory.items,
      (events ?? []).filter(Boolean) as MappedEntry[],
      (news ?? []).filter(Boolean) as MappedEntry[],
      lang,
    );

    search = (
      <HeroSearch
        directoryPath={directoryPath}
        placeholder={rest.searchPlaceholder}
        buttonLabel={rest.searchButtonLabel}
        quickLinksLabel={rest.quickLinksLabel}
        categories={categories}
        buttons={toButtons(rest.buttons, localePrefix)}
        suggestions={suggestions}
      />
    );
  }

  return (
    <Hero
      images={rest.media ?? rest.images}
      animationID={rest.animationID}
      heading={rest.heading}
      bodies={bodies}
      height={rest.height}
      size={rest.size}
      imageAlignment={rest.imageAlignment}
      animateContent={rest.animateContent}
      imageAnimate={rest.imageAnimate}
      titlePosition={rest.titlePosition}
      viewTransitionName={rest.viewTransitionName}
      extended={rest.extended}
    >
      {search}
    </Hero>
  );
};
