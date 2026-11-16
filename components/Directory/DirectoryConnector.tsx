import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import type { Crumb } from "@/components/Breadcrumbs";
import type { HeadingProps } from "@/components/Headings";
import { PageHeader } from "@/components/PageHeader";
import { getCommunityDirectory } from "@/utils/content";
import { getMessages } from "@/utils/getMessages";
import { FilterableDirectory } from "./FilterableDirectory";

type DirectoryConnectorProps = {
  id?: string;
  locale?: string;
  /** Which city's cards to show (matches each card's `city` field). */
  city?: string;
  /** Resolved `heading` reference entry (rendered via the shared Heading component). */
  heading?: HeadingProps;
  intro?: string;
  itemsPerRow?: number;
  autocomplete?: boolean;
  /**
   * Category slug from the URL path (`/community/<slug>`) — pre-selects the
   * filter so the initial server render is already scoped (shareable + SEO).
   * An unknown/empty slug 404s.
   */
  initialCategory?: string;
  /** Locale-prefixed base path for the directory, e.g. `/en/community`. Drives URL sync. */
  basePath?: string;
  /**
   * Breadcrumb trail from the page. When set, the heading and intro render as a
   * PageHeader band (like Contacts) instead of the directory's own small header.
   */
  crumbs?: Crumb[];
  crumbsLabel?: string;
};

/**
 * Server component for the `communityDirectory` section. Queries every card in
 * the section's `city`, plus the category/group taxonomy, and hands them to the
 * client FilterableDirectory. Reads draft mode so editors see previews.
 */
export async function DirectoryConnector(props: DirectoryConnectorProps) {
  const city = props.city;
  if (!city) return null;

  const locale = props.locale || "bg";
  const { isEnabled } = await draftMode();
  const data = await getCommunityDirectory(city, locale, isEnabled);

  // A category in the URL path must resolve to at least one listing; unknown or
  // empty categories 404 (no soft-404 shells for crawlers to index).
  if (
    props.initialCategory &&
    !data.items.some((it) => it.categorySlugs.includes(props.initialCategory as string))
  ) {
    notFound();
  }

  if (!data.items.length) return null;

  const m = ((getMessages(locale) as Record<string, unknown>)?.Directory ?? {}) as Record<string, string>;
  const itemsPerRow = ([1, 2, 3, 4].includes(props.itemsPerRow as number) ? props.itemsPerRow : 2) as 1 | 2 | 3 | 4;

  const pageHeader = Boolean(props.crumbs && props.heading?.heading);

  return (
    <>
      {pageHeader && (
        <PageHeader
          crumbs={props.crumbs}
          crumbsLabel={props.crumbsLabel}
          eyebrow={m.homeEyebrow}
          title={String(props.heading?.heading)}
          intro={props.intro}
        />
      )}
      <FilterableDirectory
        heading={pageHeader ? undefined : props.heading}
        intro={pageHeader ? undefined : props.intro}
        items={data.items}
        categories={data.categories}
        itemsPerRow={itemsPerRow}
        initialCategory={props.initialCategory}
        basePath={props.basePath}
        autocomplete={props.autocomplete !== false}
        labels={{
          all: m.all,
          searchPlaceholder: m.searchPlaceholder,
          searchAriaLabel: m.searchAriaLabel,
          categoryAriaLabel: m.categoryAriaLabel,
          clear: m.clear,
          noResults: m.noResults,
          suggestionsCategories: m.suggestionsCategories,
          suggestionsListings: m.suggestionsListings,
          resultsCount: m.resultsCount,
        }}
      />
    </>
  );
}

export default DirectoryConnector;
