import { draftMode } from "next/headers";
import type { ReactNode } from "react";
import { getCommunityDirectory } from "@/utils/content";
import { getLinkFieldsUrl } from "@/utils/linkHelpers";
import { getLocalePrefix } from "@/utils/localization";
import { Hero, type HeroProps } from "./Hero";
import { resolveHeroBodies } from "./heroContent";
import { HeroSearch, type HeroSearchButton, type HeroSearchCategory } from "./HeroSearch";

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

export const HeroConnector = async (props: HeroConnectorProps) => {
  const { description: _legacy, locale, ...rest } = props;
  const bodies = resolveHeroBodies(props as Record<string, unknown>, locale);

  let search: ReactNode = null;
  if (rest.extended) {
    const localePrefix = getLocalePrefix(locale);
    const { isEnabled } = await draftMode();
    const directory = await getCommunityDirectory(DIRECTORY_CITY, locale ?? "bg", isEnabled);

    // `/community/<slug>` 404s for a category with no listings, so only offer
    // chips that lead somewhere — for picked categories and the fallback alike.
    const listed = new Set(directory.items.flatMap((item) => item.categorySlugs));
    const picked = toCategories(rest.quickCategories).filter((c) => listed.has(c.slug));
    const categories = picked.length
      ? picked
      : directory.categories.filter((c) => listed.has(c.slug)).slice(0, DEFAULT_QUICK_CATEGORIES);

    search = (
      <HeroSearch
        directoryPath={`${localePrefix}/community`}
        placeholder={rest.searchPlaceholder}
        buttonLabel={rest.searchButtonLabel}
        quickLinksLabel={rest.quickLinksLabel}
        categories={categories}
        buttons={toButtons(rest.buttons, localePrefix)}
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
